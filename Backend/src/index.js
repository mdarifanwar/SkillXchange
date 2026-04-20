import dotenv from "dotenv";
import connectDB from "./config/connectDB.js";
import { app } from "./app.js";
import { Server } from "socket.io";
import { User } from "./models/user.model.js";

dotenv.config();

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

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: function (origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
      },
    });
    
    // Allow io to be accessed anywhere via req.app.get('io')
    app.set('io', io);

    io.on("connection", (socket) => {
      console.log("Connected to socket");

      socket.on("setup", async (userData) => {
        console.log("User Connected: ", userData.username);
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
        console.log("Joining chat: ", room);
        socket.join(room);
        console.log("Joined chat: ", room);
      });

      socket.on("video-call-start", (data) => {
        const { chatId, calleeId } = data;
        // If calleeId is present, send to their user room (global notification). 
        // Otherwise try the chat room (only works if they are inside that chat).
        const targetRoom = calleeId ? calleeId : chatId;
        socket.to(targetRoom).emit("video-call-incoming", data);
      });

      socket.on("video-call-end", (data) => {
        const { chatId, calleeId } = data;
        const targetRoom = calleeId ? calleeId : chatId;
        socket.to(targetRoom).emit("video-call-ended", data);
      });

      socket.on("new message", (newMessage) => {
        var chat = newMessage.chatId;
        if (!chat.users) return console.log("Chat.users not defined");

        chat.users.forEach((user) => {
          if (user._id === newMessage.sender._id) return;
          io.to(user._id).emit("message recieved", newMessage);
        });
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
        console.log("User Disconnected");
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
    console.log(err);
  });
