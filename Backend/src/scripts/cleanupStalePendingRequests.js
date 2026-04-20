import dotenv from "dotenv";
import mongoose from "mongoose";
import { Chat } from "../models/chat.model.js";
import { Request } from "../models/request.model.js";

dotenv.config();

const getPairKey = (userIdA, userIdB) => [String(userIdA), String(userIdB)].sort().join("::");

const cleanupStalePendingRequests = async () => {
  const chats = await Chat.find({}, { users: 1 }).lean();
  const connectedPairs = new Set();

  for (const chat of chats) {
    if (!Array.isArray(chat.users) || chat.users.length < 2) continue;
    connectedPairs.add(getPairKey(chat.users[0], chat.users[1]));
  }

  const pendingRequests = await Request.find({ status: "Pending" }, { _id: 1, sender: 1, receiver: 1 }).lean();
  const staleRequestIds = pendingRequests
    .filter((request) => connectedPairs.has(getPairKey(request.sender, request.receiver)))
    .map((request) => request._id);

  if (staleRequestIds.length === 0) {
    console.log("No stale pending requests found.");
    return;
  }

  const updateResult = await Request.updateMany(
    { _id: { $in: staleRequestIds } },
    { $set: { status: "Connected" } }
  );

  console.log(`Updated ${updateResult.modifiedCount} stale pending request(s) to Connected.`);
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await cleanupStalePendingRequests();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Cleanup failed:", error.message || error);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // no-op
    }
    process.exit(1);
  }
};

run();
