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
import PrivateRoutes from "./util/PrivateRoutes";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRef, useEffect } from "react";
import { useUser } from "./util/UserContext";
import io from "socket.io-client";
import axios from "axios";

const ToastCloseButton = ({ closeToast }) => (
  <button
    type="button"
    className="sx-toast-close"
    aria-label="Close notification"
    onClick={(event) => {
      event.stopPropagation();
      closeToast(event);
    }}
  >
    x
  </button>
);

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
          socketRef.current = io(import.meta.env.VITE_API_URL);
          socketRef.current.emit("setup", user);
      }

      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }

      // Listen for Notifications
      const handleMessageReceived = (newMessage) => {
        // Check if we are on the chats page (or sub-routes if any)
        const senderName = newMessage.sender?.name || "Someone";
        let content = newMessage.content || "Sent a message";
        if (content.length > 30) content = content.substring(0, 30) + "...";

        const isChatsRoute = window.location.pathname.startsWith("/chats");
        const shouldToast = !isChatsRoute;

        if (shouldToast) {
          toast.info(`New message from ${senderName}: ${content}`, {
            onClick: () => { window.location.href = "/chats"; },
            autoClose: 5000
          });
        }

        if ("Notification" in window && Notification.permission === "granted") {
          if (document.visibilityState === "hidden" || shouldToast) {
            const notification = new Notification("New message", {
              body: `${senderName}: ${content}`,
              icon: newMessage.sender?.picture || "/assets/images/user.png",
            });
            notification.onclick = () => {
              window.location.href = "/chats";
            };
          }
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
             autoClose: 8000,
               closeOnClick: true,
           }); 
      };

      const handleCallEnded = (data) => {
          toast.info("Call ended");
          if (window.location.pathname.includes("/room/")) {
              navigate("/chats");
          }
      };

      socketRef.current.on("message recieved", handleMessageReceived);
      socketRef.current.on("new request", handleNewRequest);
      socketRef.current.on("video-call-incoming", handleVideoCall);
      socketRef.current.on("video-call-ended", handleCallEnded);

      return () => {
        if(socketRef.current) {
            socketRef.current.off("message recieved", handleMessageReceived);
            socketRef.current.off("new request", handleNewRequest);
            socketRef.current.off("video-call-incoming", handleVideoCall);
            socketRef.current.off("video-call-ended", handleCallEnded);
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
        containerClassName="sx-toast-container"
        toastClassName="sx-toast"
        bodyClassName="sx-toast-body"
        progressClassName="sx-toast-progress"
        autoClose={4000}
        closeOnClick
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        draggable
        closeButton={ToastCloseButton}
        newestOnTop
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
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about_us" element={<AboutUs />} />
            <Route path="/edit_profile" element={<EditProfile />} />
            <Route path="/report/:username" element={<Report />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/rating/:username" element={<Rating />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          {!isChatPage && !isDiscoverPage && <Footer />}
        </div>
      </main>
    </div>
  );
};

export default App;
