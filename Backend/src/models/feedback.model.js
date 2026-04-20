import mongoose, { Schema } from "mongoose";

const feedbackSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedbackType: {
      type: String,
      required: true,
      enum: ["Bug Report", "Feature Suggestion", "UI/UX Issue", "General Feedback"],
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);
