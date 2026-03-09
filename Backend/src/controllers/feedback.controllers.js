import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Feedback } from "../models/feedback.model.js";

export const createFeedback = asyncHandler(async (req, res, next) => {
  const { rating, feedbackType, message } = req.body;

  if (!rating || !feedbackType || !message) {
    return next(new ApiError(400, "Please fill all the details"));
  }

  if (rating < 1 || rating > 5) {
    return next(new ApiError(400, "Rating must be between 1 and 5"));
  }

  const feedback = await Feedback.create({
    user: req.user._id,
    rating,
    feedbackType,
    message,
  });

  res.status(201).json(new ApiResponse(201, feedback, "Feedback submitted successfully"));
});

export const getAllFeedback = asyncHandler(async (req, res, next) => {

  const feedbacks = await Feedback.find()
    .populate("user", "username name email picture")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, feedbacks, "Feedbacks fetched successfully"));
});

export const getUnreadFeedbackCount = asyncHandler(async (req, res, next) => {

  const count = await Feedback.countDocuments({ isRead: false });

  res.status(200).json(new ApiResponse(200, { count }, "Unread feedback count fetched"));
});

export const markFeedbackRead = asyncHandler(async (req, res, next) => {
  const { feedbackId } = req.params;

  const feedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    { isRead: true },
    { new: true }
  );

  if (!feedback) {
    return next(new ApiError(404, "Feedback not found"));
  }

  res.status(200).json(new ApiResponse(200, feedback, "Feedback marked as read"));
});

export const markAllFeedbackRead = asyncHandler(async (req, res, next) => {

  await Feedback.updateMany({ isRead: false }, { isRead: true });

  res.status(200).json(new ApiResponse(200, null, "All feedbacks marked as read"));
});

export const deleteFeedback = asyncHandler(async (req, res, next) => {
  const { feedbackId } = req.params;

  const feedback = await Feedback.findByIdAndDelete(feedbackId);

  if (!feedback) {
    return next(new ApiError(404, "Feedback not found"));
  }

  res.status(200).json(new ApiResponse(200, null, "Feedback deleted successfully"));
});
