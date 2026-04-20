import { Router } from "express";
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

router.get("/google", googleAuthHandler);
router.get("/google/callback", googleAuthCallback, handleGoogleLoginCallback);
router.get("/logout", handleLogout);
router.post("/signup", handleEmailSignup);
router.post("/login", handleEmailLogin);
router.post("/forgot-password", handleForgotPassword);
router.post("/reset-password/:token", handleResetPassword);

export default router;
