import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../../util/UserContext";
import Spinner from "react-bootstrap/Spinner";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import ScrollableFeed from "react-scrollable-feed";
import { FiSend, FiVideo } from "react-icons/fi";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import RequestCard from "./RequestCard";
import "./Chats.css";

const Chats = () => {
    // Track the currently selected chat
    const [currentChat, setCurrentChat] = useState(null);
  const socketRef = useRef();
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' or 'requests'
  const [requests, setRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [acceptRequestLoading, setAcceptRequestLoading] = useState(false);
  const { user } = useUser();
  const userId = user?._id;
  const navigate = useNavigate();
  const { id } = useParams();

  // to store chat messages
  const [chatMessages, setChatMessages] = useState([]);
  // to store chats
  const [chats, setChats] = useState([]);
  // Loading states
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessageLoading, setChatMessageLoading] = useState(false);
  // to store message
  const [message, setMessage] = useState("");

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestModalShow, setRequestModalShow] = useState(false);

  // Handler for selecting a chat from the sidebar
  const handleChatClick = (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    setCurrentChat(chat || null);
    if (chatId !== id) {
      navigate(`/chats/${chatId}`);
    }
  };

  // Fetch chat list from backend
  const fetchChats = async () => {
    let attempts = 0;
    setChatLoading(true);
    const tempUser = JSON.parse(localStorage.getItem("userInfo"));
    while (attempts < 3) {
      try {
        const { data } = await axios.get("/chat");
        if (data.data) {
          const temp = data.data
              .filter((chat) => chat.users && chat.users.length > 0)
              .map((chat) => {
                const otherUser = chat?.users.find((u) => u?._id !== tempUser?._id);
                if (!otherUser) {
                    return {
                        id: chat._id,
                        name: "Unknown User",
                        picture: "/assets/images/user.png",
                        username: "unknown",
                        userId: null,
                        isOnline: false,
                        lastSeen: null
                    }
                }
                return {
                  id: chat._id,
                  name: otherUser.name,
                  picture: otherUser.picture,
                  username: otherUser.username,
                  userId: otherUser._id,
                  isOnline: otherUser.isOnline,
                  lastSeen: otherUser.lastSeen
                };
          });
          setChats(temp);
          break;
        } else {
          toast.error("No chats found");
          break;
        }
      } catch (err) {
        attempts++;
        const backendMessage = err?.response?.data?.message;
        if (backendMessage) {
          toast.error(backendMessage);
          break;
        }
        if (attempts >= 3) toast.error("Failed to load chats after 3 attempts");
      }
    }
    setChatLoading(false);
  };
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(axios.defaults.baseURL, { withCredentials: true });
    }
    if (user) {
      socketRef.current.emit("setup", user);
      fetchChats();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const markChatAsRead = async (chatId) => {
      if(!chatId) return;
      try {
          await axios.put("/message/read", { chatId });
          socketRef.current.emit("messages read", { chatId, readerId: user._id });
      } catch (error) {
          console.error("Error marking messages as read", error);
      }
  };
  
  const markChatAsDelivered = async (chatId) => {
      if(!chatId) return;
      try {
          await axios.put("/message/delivered", { chatId });
          socketRef.current.emit("messages delivered", { chatId, userId: user._id });
      } catch(error) {
           console.error("Error marking messages as delivered", error);
      }
  } 

    // Handle socket events
    useEffect(() => {
    if (!socketRef.current) return;

    const messageReceivedHandler = (newMessageRecieved) => {
      if (id && newMessageRecieved.chatId && id === (newMessageRecieved.chatId._id || newMessageRecieved.chatId)) {
      setChatMessages((prev) => {
        if (prev.find(msg => msg._id === newMessageRecieved._id)) {
          return prev;
        }
        return [...prev, newMessageRecieved];
      });
      if(newMessageRecieved.sender._id !== user._id) {
         socketRef.current.emit("messages delivered", { chatId: id, userId: user._id });
         socketRef.current.emit("messages read", { chatId: id, readerId: user._id });
         axios.put("/message/delivered", { chatId: id }).catch(console.error);
         axios.put("/message/read", { chatId: id }).catch(console.error);
      }
      } else {
        if(newMessageRecieved.chatId && newMessageRecieved.sender._id !== user._id) {
           const msgChatId = newMessageRecieved.chatId._id || newMessageRecieved.chatId;
           socketRef.current.emit("messages delivered", { chatId: msgChatId, userId: user._id });
           axios.put("/message/delivered", { chatId: msgChatId }).catch(console.error);
        }
      }
    };

    const userStatusHandler = ({ userId, isOnline, lastSeen }) => {
      setChats(prevChats => prevChats.map(chat => {
        if (chat.userId === userId) {
          return { ...chat, isOnline, lastSeen };
        }
        return chat;
      }));
    };

    const messagesReadHandler = ({ chatId, readerId }) => {
      if (id === chatId) {
        setChatMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.sender._id === user._id && !msg.readBy?.includes(readerId)) {
              return { 
                ...msg, 
                readBy: [...(msg.readBy || []), readerId],
                deliveredTo: [...(msg.deliveredTo || []), readerId]
              };
            }
            return msg;
          })
        );
      }
    };

    const messagesDeliveredHandler = ({ chatId, userId }) => {
      if (id === chatId) {
        setChatMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.sender._id === user._id && !msg.deliveredTo?.includes(userId)) {
              return { ...msg, deliveredTo: [...(msg.deliveredTo || []), userId] };
            }
            return msg;
          })
        );
      }
    };

    socketRef.current.on("message recieved", messageReceivedHandler);
    socketRef.current.on("user-status", userStatusHandler);
    socketRef.current.on("messages read update", messagesReadHandler);
    socketRef.current.on("messages delivered update", messagesDeliveredHandler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("message recieved", messageReceivedHandler);
        socketRef.current.off("user-status", userStatusHandler);
        socketRef.current.off("messages read update", messagesReadHandler);
        socketRef.current.off("messages delivered update", messagesDeliveredHandler);
      }
    };
  }, [id, user]);

  useEffect(() => {
    setChatMessages([]);
    // Set currentChat based on id param when chats are loaded or id changes
    if (id && chats.length > 0) {
      const chat = chats.find((c) => c.id === id);
      setCurrentChat(chat || null);
    } else {
      setCurrentChat(null);
    }
  }, [id, chats]);

  useEffect(() => {

    if (!id || chats.length === 0) return;

    const chatExists = chats.some(chat => chat.id === id);
    if (!chatExists) return;

    let isMounted = true;

    const fetchMessages = async () => {
      let attempts = 0;
      setChatMessageLoading(true);
      while (attempts < 3) {
        try {
          const { data } = await axios.get(`/message/getMessages/${id}`);
          if (isMounted) {
            setChatMessages(Array.isArray(data.data) ? data.data : []);
            if (socketRef.current) socketRef.current.emit("join chat", id);
            markChatAsRead(id);
            break;
          }
        } catch (err) {
          attempts++;
          if (isMounted) {
            if (attempts >= 3) toast.error("Failed to load messages after 3 attempts");
          }
        }
      }
      if (isMounted) setChatMessageLoading(false);
    };
    fetchMessages();

    return () => {
        isMounted = false;
    };
  }, [id, chats]);

  const sendMessage = async (e) => {
    // If e exists, it's an event (click or keydown). If called without arguments, validation was done by caller.
    // However, the original logic checked e.key inside.
    // Let's make it robust:
    if (e && (e.type === 'keydown' && e.key !== 'Enter')) return;
    
    if (message.trim() && id) {
        try {
        socketRef.current.emit("stop typing", id);
        const { data } = await axios.post("/message/sendMessage", { chatId: id, content: message });
        
        socketRef.current.emit("new message", data.data);
        setChatMessages((prevState) => [...prevState, data.data]);
        setMessage("");
        } catch (err) {
        toast.error("Failed to send message");
        }
    }
  };

  const getRequests = async () => {
    try {
      setRequestLoading(true);
      const { data } = await axios.get("/request/getRequests");
      setRequests(data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load requests");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setRequestModalShow(true);
  };

  const handleRequestAccept = async () => {
    try {
      setAcceptRequestLoading(true);
      const { data } = await axios.post("/request/acceptRequest", { requestId: selectedRequest._id }, { withCredentials: true });
      toast.success(data.message);
      setRequests((prevState) => prevState.filter((req) => req._id !== selectedRequest._id));
      setRequestModalShow(false);
      // Refresh chats after accepting a request
      fetchChats();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to accept request");
    } finally {
      setAcceptRequestLoading(false);
    }
  };

  const handleRequestReject = async () => {
    try {
      setAcceptRequestLoading(true);
      const { data } = await axios.post("/request/rejectRequest", { requestId: selectedRequest._id }, { withCredentials: true });
      toast.success(data.message);
      setRequests((prevState) => prevState.filter((req) => req._id !== selectedRequest._id));
      setRequestModalShow(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject request");
    } finally {
      setAcceptRequestLoading(false);
    }
  };

  const handleInput = (e) => {
      setMessage(e.target.value);
  }

  // Helper to format last seen
  const formatLastSeen = (dateString) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const isYesterday = new Date(now - 86400000).getDate() === date.getDate();

    if (isToday) {
        return `Last seen today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } else if (isYesterday) {
        return `Last seen yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } else {
        return `Last seen on ${date.toLocaleDateString()}`;
    }
  }

  // Helper to format time
  const formatTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const handleVideoCall = () => {
       if (!currentChat) return;
       // Generate a unique room ID (e.g., based on chatId + timestamp)
       const roomId = `${currentChat.id}-${Date.now()}`;
       
       // Navigate to the video call session
       navigate(`/room/${roomId}`);
       
       // Optionally emit an event to notify the other user (handled by Room component usually, but good to signal intent)
         socketRef.current.emit("video-call-start", { 
           chatId: currentChat.id,
           calleeId: currentChat.userId,
           roomId: roomId,
           callerName: user.name
         });
  };

  // Fetch requests when switching to 'requests' tab
  useEffect(() => {
    if (activeTab === 'requests') {
      getRequests();
    }
  }, [activeTab]);

  return (
    <div className="chat-page">
      <div className={`chat-layout ${currentChat ? 'mobile-chat-active' : ''}`}>
      
      {/* SIDEBAR */}
      <div className={`chat-sidebar ${currentChat ? 'mobile-hidden' : ''}`}>
        <div className="chat-tabs">
          <button  
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat History
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests {requests.length > 0 && `(${requests.length})`}
          </button>
        </div>

        <div className="chat-list-scroll">
            {activeTab === 'chat' ? (
                chatLoading ? (
                    <div className="d-flex justify-content-center mt-5">
                      <Spinner animation="border" variant="primary" />
                    </div>
                ) : (
                    chats.map((chat) => (
                        <div 
                            key={chat.id} 
                            className={`chat-user ${currentChat?.id === chat.id ? 'active' : ''}`}
                            onClick={() => handleChatClick(chat.id)}
                        >
                            <img 
                                src={chat.picture || "https://via.placeholder.com/150"} 
                                alt={chat.name} 
                                className="chat-avatar"
                            />
                            <div className="chat-item-info">
                                <div className="chat-item-name">{chat.name}</div>
                                <div className="chat-item-last-msg">@{chat.username}</div>
                            </div>
                        </div>
                    ))
                )
            ) : (
                // REQUESTS LIST
                requestLoading ? (
                    <div className="d-flex justify-content-center mt-5">
                      <Spinner animation="border" variant="primary" />
                    </div>
                ) : (
                    requests.map((req) => (
                      <div 
                        key={req._id} 
                        className="chat-user"
                        onClick={() => handleRequestClick(req)}
                      >
                        <img 
                          src={req.sender?.picture || "https://via.placeholder.com/150"} 
                          alt={req.sender?.name || "User"} 
                          className="chat-avatar"
                        />
                        <div className="chat-item-info">
                          <div className="chat-item-name">{req.sender?.name}</div>
                          <div className="chat-item-last-msg">Server Request</div>
                        </div>
                      </div>
                    ))
                )
            )}
            
            {activeTab === 'chat' && chats.length === 0 && !chatLoading && (
                <div className="text-center mt-5 text-muted">No chats yet.</div>
            )}
        </div>
      </div>

      {/* CHAT CONTENT */}
      <div className={`chat-content active ${currentChat ? '' : 'no-chat-selected'}`}>
        {currentChat ? (
            <>
                <div className="chat-header">
                  <div className="chat-header-user">
                    {/* Mobile Back Button */}
                    <button 
                        className="d-md-none btn btn-link p-0 me-3 text-dark"
                        onClick={() => navigate("/chats")}
                    >
                        <i className="bi bi-arrow-left fs-4"></i>
                    </button>
                    
                    <img 
                        src={currentChat.picture || "https://via.placeholder.com/150"} 
                        alt={currentChat.name} 
                        className="chat-avatar"
                    />
                    <div className="chat-user-info">
                      <h4>{currentChat.name}</h4>
                      {currentChat.isOnline ? (
                        <span className="user-online">Online</span>
                      ) : (
                        <span className="user-offline">{currentChat.lastSeen ? formatLastSeen(currentChat.lastSeen) : 'Offline'}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Video Call Button */}
                    <button
                      className="video-call-btn"
                      onClick={handleVideoCall}
                      title="Start Video Session"
                    >
                      <FiVideo size={22} className="video-call-icon" />
                  </button>
                </div>

                <div className="chat-messages">
                    {chatMessageLoading ? (
                        <div className="d-flex justify-content-center align-items-center h-100">
                             <Spinner animation="border" variant="primary" />
                        </div>
                    ) : (
                        <ScrollableFeed className="chat-feed">
                            {chatMessages.map((msg, index) => {
                                const isSender = msg.sender._id === user._id; 
                                return (
                                    <div key={index} className={`message ${isSender ? 'sent' : 'received'}`}>
                                        <div className="bubble">
                                            {msg.content}
                                        </div>
                                        <div className="message-meta" style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                            <span className="time" style={{ margin: 0 }}>{formatTime(msg.createdAt)}</span>
                                            {isSender && (
                                                <>
                                                {/* Check Read Status - BLUE */}
                                                {(msg.readBy && msg.readBy.length > 0 && msg.readBy.some(id => id !== user._id)) ? (
                                                    <BsCheckAll 
                                                        className="message-status-icon"
                                                        style={{ fontSize: "1.2em", color: "#60a5fa" }} // Blue Double Tick
                                                        title="Read"
                                                    />
                                                ) : 
                                                /* Check Delivered Status - GRAY DOUBLE */
                                                (msg.deliveredTo && msg.deliveredTo.length > 0 && msg.deliveredTo.some(id => id !== user._id)) ? (
                                                    <BsCheckAll 
                                                        className="message-status-icon"
                                                        style={{ fontSize: "1.2em", color: "#9ca3af" }} // Grey Double Tick
                                                        title="Delivered"
                                                    />
                                                ) :
                                                /* Default - GRAY SINGLE */
                                                (
                                                    <BsCheck 
                                                        className="message-status-icon"
                                                        style={{ fontSize: "1.2em", color: "#9ca3af" }} // Grey Single Tick
                                                        title="Sent"
                                                    />
                                                )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </ScrollableFeed>
                    )}
                </div>

                <div className="chat-input">
                    <input 
                        type="text" 
                        placeholder="Type a message..." 
                        value={message}
                        onChange={handleInput} 
                        onKeyDown={sendMessage}
                    />
                    <button onClick={sendMessage}>
                        <FiSend size={20} />
                    </button>
                </div>
            </>
        ) : (
            <div className="empty-chat">
                 <div className="no-chat-icon"></div>
                 <h2>Select a conversation</h2>
                 <p>Choose a chat from the sidebar to start messaging</p>
            </div>
        )}
      </div>

      {/* Request Modal */}
        {requestModalShow && selectedRequest && (
        <div className="modal-overlay" onClick={() => setRequestModalShow(false)}>
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-center">Connection Request</h3>
            <RequestCard 
              name={selectedRequest.sender?.name || "Unknown"}
              skills={selectedRequest.sender?.skillsProficientAt || []}
              rating="New"
              picture={selectedRequest.sender?.picture || "https://via.placeholder.com/150"}
              username={selectedRequest.sender?.username || "unknown"}
              onClose={() => setRequestModalShow(false)}
            />
            <div className="modal-actions">
              <button 
                className="btn btn-outline-danger" 
                onClick={handleRequestReject}
                disabled={acceptRequestLoading}
              >
                Reject
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleRequestAccept}
                disabled={acceptRequestLoading}
              >
                {acceptRequestLoading ? 'Processing...' : 'Accept Request'}
              </button>
            </div>
          </div>
        </div>
        )}

      </div> 
    </div>
  );
}
// End Chats component
export default Chats;
