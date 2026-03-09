import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import { app } from "./app.js";
import { Server } from "socket.io";
import { User } from "./models/user.model.js";
import { Chat } from "./models/chat.model.js";
import jwt from "jsonwebtoken";

dotenv.config();

// Validate required environment variables on startup
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

// Catch unhandled promise rejections to prevent server crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    console.log("Database connected");
    // Ensure server listens on all network interfaces (0.0.0.0)
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Server listening on port ${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use. Please kill the process running on this port.`);
            process.exit(1);
        }
    });

    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: process.env.CORS_ORIGINS
          ? process.env.CORS_ORIGINS.split(",")
          : ["http://localhost:5173", "http://localhost:5174"],
        credentials: true
      },
    });
    
    // Allow io to be accessed anywhere via req.app.get('io')
    app.set('io', io);

    // Socket.io JWT authentication middleware
    io.use((socket, next) => {
      try {
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader) {
          return next(new Error("Authentication required"));
        }
        // Parse the cookie string to extract accessToken
        const cookies = {};
        cookieHeader.split(";").forEach((c) => {
          const [key, ...val] = c.trim().split("=");
          cookies[key] = val.join("=");
        });
        const token = cookies.accessToken;
        if (!token) {
          return next(new Error("Authentication required"));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.decodedUser = decoded;
        next();
      } catch (err) {
        return next(new Error("Invalid or expired token"));
      }
    });

    io.on("connection", (socket) => {

      socket.on("setup", async (userData) => {
        // Verify the client-provided userId matches the JWT
        if (!socket.decodedUser || socket.decodedUser.id !== userData._id) {
          return socket.emit("error", { message: "User ID mismatch" });
        }
        socket.join(userData._id);
        socket.emit("connected");
        
        try {
            await User.findByIdAndUpdate(userData._id, { isOnline: true });
            socket.broadcast.emit("user-status", { userId: userData._id, isOnline: true });
        } catch (error) {
            console.error("Error updating online status:", error);
        }
        
        // Use socket.userData to store user info for disconnect handling
        socket.userData = userData; 
      });

      socket.on("join chat", (room) => {
        socket.join(room);
      });

      socket.on("video-call-start", (data) => {
        if (!socket.userData) {
          return socket.emit("error", { message: "Not authenticated" });
        }
        const { chatId, calleeId } = data;
        if (!chatId) {
          return socket.emit("error", { message: "Invalid call data" });
        }
        const targetRoom = calleeId ? calleeId : chatId;

        // Check if callee is online by looking for their socket room
        if (calleeId) {
          const calleeRoom = io.sockets.adapter.rooms.get(calleeId);
          if (!calleeRoom || calleeRoom.size === 0) {
            return socket.emit("video-call-user-offline", { calleeId });
          }
        }

        socket.to(targetRoom).emit("video-call-incoming", data);
      });

      socket.on("video-call-end", (data) => {
        const { chatId, calleeId } = data;
        if (!chatId) return;
        const targetRoom = calleeId ? calleeId : chatId;
        socket.to(targetRoom).emit("video-call-ended", data);
      });

      socket.on("new message", async (newMessage) => {
        try {
          const chat = await Chat.findById(newMessage.chatId?._id || newMessage.chatId).populate("users");
          if (!chat) return;

          chat.users.forEach((user) => {
            if (user._id.toString() === newMessage.sender._id) return;
            io.to(user._id.toString()).emit("message recieved", newMessage);
          });
        } catch (err) {
          console.error("Error in new message handler:", err.message);
        }
      });

      socket.on("messages read", ({ chatId, readerId }) => {
          // Notify everyone in the chat room that messages have been read
          // The sender of the original messages (who is NOT the reader) needs to know
          socket.broadcast.to(chatId).emit("messages read update", { chatId, readerId });
      });

      socket.on("messages delivered", ({ chatId, userId }) => {
          // Notify the sender that the message was delivered to the user
          socket.broadcast.to(chatId).emit("messages delivered update", { chatId, userId });
      });

      socket.on("disconnect", async () => {
        if (socket.userData && socket.userData._id) {
            const userId = socket.userData._id;
            const lastSeen = new Date();
             try {
                await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: lastSeen });
                socket.broadcast.emit("user-status", { userId: userId, isOnline: false, lastSeen: lastSeen });
                socket.leave(userId);
            } catch (error) {
                console.error("Error updating offline status:", error);
            }
        }
      });
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
