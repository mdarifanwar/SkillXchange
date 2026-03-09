import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  googleAuthCallback,
  googleAuthHandler,
  handleGoogleLoginCallback,
  handleLogout,
  handleEmailSignup,
  handleEmailLogin,
  handleForgotPassword,
  handleResetPassword,
} from "../controllers/auth.controllers.js";

const router = Router();

// Rate limiters for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { success: false, message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per window
  message: { success: false, message: "Too many password reset requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/google", googleAuthHandler);
router.get("/google/callback", googleAuthCallback, handleGoogleLoginCallback);
router.get("/logout", handleLogout);
router.post("/signup", authLimiter, handleEmailSignup);
router.post("/login", authLimiter, handleEmailLogin);
router.post("/forgot-password", forgotPasswordLimiter, handleForgotPassword);
router.post("/reset-password/:token", authLimiter, handleResetPassword);

export default router;
