import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../utils/generateJWTToken.js";

export const createChat = asyncHandler(async (req, res) => {
  console.log("\n******** Inside createChat Controller function ********");

  const { users } = req.body;

  if (!users || users.length === 0) {
    throw new ApiError(400, "Please provide all the details");
  }

  // Atomically find or create a chat between these users to avoid duplicates
  const filter = { users: { $all: users } };
  const update = { $setOnInsert: { users: users } };
  const options = { new: true, upsert: true };

  const chat = await Chat.findOneAndUpdate(filter, update, options);

  // Populate returned chat
  const fullChat = await Chat.findOne({ _id: chat._id }).populate("users", "-password").populate("latestMessage");

  if (!fullChat) {
    throw new ApiError(500, "Error creating chat");
  }

  return res.status(200).json(new ApiResponse(200, fullChat, "Chat created successfully"));
});

export const getChats = asyncHandler(async (req, res) => {
  console.log("\n******** Inside getChats Controller function ********");
  const userId = req.user._id;
  try {
    const chats = await Chat.find({ users: userId })
      .populate("users", "username name picture isOnline lastSeen")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });
    if (!chats || chats.length === 0) {
      console.warn("No chats found for user:", userId);
      return res.status(200).json(new ApiResponse(200, [], "No chats found"));
    }
    return res.status(200).json(new ApiResponse(200, chats, "Chats fetched successfully"));
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json(new ApiResponse(500, [], "Error fetching chats"));
  }
});
