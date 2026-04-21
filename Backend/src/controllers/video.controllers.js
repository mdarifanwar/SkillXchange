import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { generateZegoToken } from "../utils/generateZegoToken.js";

export const getVideoToken = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  if (!roomId) {
    throw new ApiError(400, "Room ID is required");
  }

  const appIdRaw = process.env.ZEGO_APP_ID;
  const serverSecret = process.env.ZEGO_SERVER_SECRET;
  const appId = Number(appIdRaw);

  const maskSecret = (value) => {
    if (!value) return "<missing>";
    const trimmed = value.trim();
    if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`;
    return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
  };

  console.log("[Zego] appId raw:", appIdRaw);
  console.log("[Zego] appId parsed:", appId);
  console.log("[Zego] serverSecret length:", serverSecret ? serverSecret.trim().length : 0);
  console.log("[Zego] serverSecret masked:", maskSecret(serverSecret));

  if (!appId || !Number.isFinite(appId)) {
    throw new ApiError(500, "Invalid ZEGO_APP_ID");
  }
  if (!serverSecret || !serverSecret.trim()) {
    throw new ApiError(500, "Missing ZEGO_SERVER_SECRET");
  }

  const userId = req.user._id.toString();
  const userName = req.user.name || "Guest";

  const token = generateZegoToken(appId, serverSecret.trim(), roomId, userId, userName);

  console.log("[Zego] token length:", token.length);
  console.log("[Zego] token prefix:", token.slice(0, 10));

  res.status(200).json(
    new ApiResponse(200, { token, appId }, "Token generated successfully")
  );
});
