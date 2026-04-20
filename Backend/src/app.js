import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { getVideoToken } from "./controllers/video.controllers.js";
import { verifyJWT_username } from "./middlewares/verifyJWT.middleware.js";

const app = express();

if (process.env.NODE_ENV === "production") {
  // Required for secure cookies behind proxies (Render, Vercel, etc.)
  app.set("trust proxy", 1);
}

// Global request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); // to parse json in body
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // to parse url
app.use(express.static("public")); // to use static public folder
app.use(cookieParser()); // to enable CRUD operation on browser cookies

app.get("/", (req, res) => {
  res.send("API is running");
});

// app.use(function (req, res, next) {
//   res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "http://localhost:5173");
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   // Add other CORS headers as needed
//   next();
// });

// Passport middleware
app.use(passport.initialize());

// Importing routes
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";
import requestRouter from "./routes/request.routes.js";
import reportRouter from "./routes/report.routes.js";
import ratingRouter from "./routes/rating.routes.js";
import videoRouter from "./routes/video.routes.js";

// Using routes
console.log("User routes loaded");
app.use("/api/user", userRouter);
// Keep OAuth callbacks on /auth and expose API auth on /api/auth.
app.use("/auth", authRouter);
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/request", requestRouter);
app.use("/api/report", reportRouter);
app.use("/api/rating", ratingRouter);
// Direct route to avoid missing mount issues during development.
app.get("/api/video/token/:roomId", verifyJWT_username, getVideoToken);
app.use("/api/video", videoRouter);

export { app };
