import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../utils/generateJWTToken.js";
import { Request } from "../models/request.model.js";
import { Chat } from "../models/chat.model.js";
import { sendMail } from "../utils/SendMail.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export const createRequest = asyncHandler(async (req, res, next) => {

  const { receiverID } = req.body;
  const senderID = req.user._id;


  const existingChat = await Chat.findOne({ users: { $all: [senderID, receiverID] } });
  if (existingChat) {
    throw new ApiError(409, "You are already connected with this user");
  }

  const existingRequest = await Request.findOne({
    $or: [
      { sender: senderID, receiver: receiverID, status: "Pending" },
      { sender: receiverID, receiver: senderID, status: "Pending" },
    ],
  });

  if (existingRequest) {
    throw new ApiError(400, "Request already exists");
  }

  const receiverUser = await User.findById(receiverID);
  if (!receiverUser) {
    throw new ApiError(404, "User not found to send request");
  }

  const receiver = await Request.create({
    sender: senderID,
    receiver: receiverID,
  });

  if (!receiver) return next(new ApiError(500, "Request not created"));

  const emailSubject = "SkillXchange: New Request Recieved";
  const emailMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4CAF50;">SkillXchange Connection Request</h2>
                <p>Hello <strong>${escapeHtml(receiverUser.name)}</strong>,</p>
                <p>You have received a new connection request from <strong>${escapeHtml(req.user.name)} (${escapeHtml(req.user.username)})</strong>.</p>
                <p>They are interested in your skills and would like to connect!</p>
                <br/>
                <p>Please login to your SkillXchange account to accept or reject the request.</p>
                <p><a href="${FRONTEND_URL}/chats" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Requests</a></p>
                <p>Best Regards,<br/>SkillXchange Team</p>
            </div>
        `;

  await sendMail(receiverUser.email, emailSubject, emailMessage);

  // Emit socket event for real-time notification
  const io = req.app.get("io");
  if (io) {
    // Ensure receiverID is a string for socket room
    io.to(receiverID.toString()).emit("new request", {
      sender: {
        _id: req.user._id,
        name: req.user.name,
        picture: req.user.picture
      },
      requestId: receiver._id,
      message: `${req.user.name} sent you a connection request.`
    });
  }

  res.status(201).json(new ApiResponse(201, receiver, "Request created successfully"));
});

export const getRequests = asyncHandler(async (req, res, next) => {

  const receiverID = req.user._id;

  const requests = await Request.find({ receiver: receiverID, status: "Pending" }).populate("sender");
  // Return the full request objects so frontend has access to _id
  return res.status(200).json(new ApiResponse(200, requests, "Requests fetched successfully"));
});

export const acceptRequest = asyncHandler(async (req, res, next) => {

  const { requestId } = req.body;
  const receiverId = req.user._id;

  const request = await Request.findById(requestId);
  if (!request) {
    console.error("Request not found for id:", requestId);
    throw new ApiError(400, "Request does not exist");
  }
  if (request.receiver.toString() !== receiverId.toString()) {
    console.error("Receiver mismatch. Request.receiver:", request.receiver, "Current user:", receiverId);
    throw new ApiError(403, "You are not authorized to accept this request");
  }

  // Find existing chat or create a new one
  let chat = await Chat.findOne({ users: { $all: [request.sender, receiverId] } });
  if (!chat) {
    chat = await Chat.create({ users: [request.sender, receiverId] });
  }
  if (!chat) return next(new ApiError(500, "Chat not created"));

  await Request.findByIdAndUpdate(requestId, { status: "Connected" });
  // Populate chat users before returning
  const populatedChat = await Chat.findById(chat._id).populate("users", "username name picture");
  res.status(201).json(new ApiResponse(201, populatedChat, "Request accepted successfully"));
});

export const rejectRequest = asyncHandler(async (req, res, next) => {

  const { requestId } = req.body;
  const receiverId = req.user._id;

  const request = await Request.findById(requestId);
  if (!request) {
    throw new ApiError(400, "Request does not exist");
  }
  if (request.receiver.toString() !== receiverId.toString()) {
    throw new ApiError(403, "You are not authorized to reject this request");
  }

  await Request.findByIdAndUpdate(requestId, { status: "Rejected" });
  res.status(200).json(new ApiResponse(200, null, "Request rejected successfully"));
});
