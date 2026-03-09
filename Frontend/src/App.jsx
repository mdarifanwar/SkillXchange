import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Footer from "./Components/Footer/Footer";
import Discover from "./Pages/Discover/Discover";
import Login from "./Pages/Login/Login";
import Header from "./Components/Navbar/Navbar";
import LandingPage from "./Pages/LandingPage/LandingPage";
import AboutUs from "./Pages/AboutUs/AboutUs";
import Chats from "./Pages/Chats/Chats";
import Report from "./Pages/Report/Report";
import Profile from "./Pages/Profile/Profile";
import NotFound from "./Pages/NotFound/NotFound";
import GoogleAuthCallback from "./Pages/Login/GoogleAuthCallback";
import Register from "./Pages/Register/Register";
import Rating from "./Pages/Rating/Rating";
import EditProfile from "./Pages/EditProfile/EditProfile";
import Room from "./Pages/Room/Room";
import ResetPassword from "./Pages/ResetPassword/ResetPassword";
import Feedback from "./Pages/Feedback/Feedback";
import AdminFeedback from "./Pages/AdminFeedback/AdminFeedback";
import PrivateRoutes from "./util/PrivateRoutes";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRef, useEffect } from "react";
import { useUser } from "./util/UserContext";
import io from "socket.io-client";
import axios from "axios";

const App = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef();
  const isChatPage = location.pathname.startsWith("/chats");
  const isDiscoverPage = location.pathname.startsWith("/discover");

  useEffect(() => {
    if (user) {
      if(!socketRef.current) {
          socketRef.current = io(axios.defaults.baseURL);
          socketRef.current.emit("setup", user);
      }

      // Listen for Notifications
      const handleMessageReceived = (newMessage) => {
        // Check if we are on the chats page (or sub-routes if any)
        if (!window.location.pathname.startsWith("/chats")) {
           const senderName = newMessage.sender?.name || "Someone";
           // Truncate message
           let content = newMessage.content || "Sent a message";
           if (content.length > 30) content = content.substring(0, 30) + "...";
           
           toast.info(`New message from ${senderName}: ${content}`, {
               onClick: () => { window.location.href = "/chats"; },
               autoClose: 5000
           });
        }
      };
      
      const handleNewRequest = (data) => {
          const senderName = data.sender?.name || "A user";
          toast.success(`New connection request from ${senderName}`, {
              onClick: () => { window.location.href = "/chats"; }
          });
      };
      
      const handleVideoCall = (data) => {
           toast.info(`Incoming video call from ${data.callerName || "Unknown"}`, {
               onClick: () => { window.location.href = `/room/${data.roomId}`; },
               autoClose: false,
               closeOnClick: true,
           }); 
      };

      const handleCallEnded = (data) => {
          toast.info("Call ended");
          if (window.location.pathname.includes("/room/")) {
              navigate("/chats");
          }
      };

      const handleUserOffline = () => {
          toast.warning("User is offline. Cannot start video call.");
          if (window.location.pathname.includes("/room/")) {
              navigate("/chats");
          }
      };

      socketRef.current.on("message recieved", handleMessageReceived);
      socketRef.current.on("new request", handleNewRequest);
      socketRef.current.on("video-call-incoming", handleVideoCall);
      socketRef.current.on("video-call-ended", handleCallEnded);
      socketRef.current.on("video-call-user-offline", handleUserOffline);

      return () => {
        if(socketRef.current) {
            socketRef.current.off("message recieved", handleMessageReceived);
            socketRef.current.off("new request", handleNewRequest);
            socketRef.current.off("video-call-incoming", handleVideoCall);
            socketRef.current.off("video-call-ended", handleCallEnded);
            socketRef.current.off("video-call-user-offline", handleUserOffline);
            // Don't disconnect here if we want to keep connection alive across re-renders,
            // but for App component, unmount means closing app usually.
            // If user changes, we might want to re-setup.
        }
      };
    } else {
        // If user logs out, disconnect
        if(socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }
  }, [user]); // user dependency only. Navigate is stable.

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        limit={3}
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
      />

      <main className="pt-16 flex flex-1 overflow-hidden">
        <div className={`h-full flex-1 ${(isDiscoverPage || isChatPage) ? "overflow-hidden" : "overflow-y-auto"}`}>
          <Routes>
            <Route element={<PrivateRoutes />}>
              <Route path="/chats" element={<Chats />} />
              <Route path="/chats/:id" element={<Chats />} />
            </Route>
            <Route path="/" element={<LandingPage />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about_us" element={<AboutUs />} />
            <Route path="/edit_profile" element={<EditProfile />} />
            <Route path="/report/:username" element={<Report />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/rating/:username" element={<Rating />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          {!isChatPage && !isDiscoverPage && <Footer />}
        </div>
      </main>
    </div>
  );
};

export default App;
