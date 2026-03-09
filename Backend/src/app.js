import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import xssFilters from "xss-filters";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); // to parse json in body
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // to parse url
app.use(express.static("public")); // to use static public folder
app.use(cookieParser()); // to enable CRUD operation on browser cookies

// XSS sanitization middleware - sanitize all string fields in request body
const sanitizeValue = (val) => {
  if (typeof val === "string") return xssFilters.inHTMLData(val);
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val && typeof val === "object") {
    const sanitized = {};
    for (const key of Object.keys(val)) {
      sanitized[key] = sanitizeValue(val[key]);
    }
    return sanitized;
  }
  return val;
};

app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }
  next();
});

// Passport middleware
app.use(passport.initialize());

// Importing routes
// Default root route
app.get("/", (req, res) => {
  res.json({ success: true, message: "SkillXChange API is running" });
});

// Test route
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "API test successful" });
});

import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";
import requestRouter from "./routes/request.routes.js";
import reportRouter from "./routes/report.routes.js";
import ratingRouter from "./routes/rating.routes.js";
import feedbackRouter from "./routes/feedback.routes.js";
import videoRouter from "./routes/video.routes.js";

// Using routes
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/request", requestRouter);
app.use("/api/report", reportRouter);
app.use("/api/rating", ratingRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/video", videoRouter);

// 404 catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

export { app };
