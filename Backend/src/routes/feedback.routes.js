import express from "express";
import {
  createFeedback,
  getAllFeedback,
  getUnreadFeedbackCount,
  markFeedbackRead,
  markAllFeedbackRead,
  deleteFeedback,
} from "../controllers/feedback.controllers.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.middleware.js";

const router = express.Router();

// User route
router.post("/create", verifyJWT_username, createFeedback);

// Admin routes
router.get("/all", verifyJWT_username, verifyAdmin, getAllFeedback);
router.get("/unread-count", verifyJWT_username, verifyAdmin, getUnreadFeedbackCount);
router.put("/mark-read/:feedbackId", verifyJWT_username, verifyAdmin, markFeedbackRead);
router.put("/mark-all-read", verifyJWT_username, verifyAdmin, markAllFeedbackRead);
router.delete("/delete/:feedbackId", verifyJWT_username, verifyAdmin, deleteFeedback);

export default router;
