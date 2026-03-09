import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { generateZegoToken } from "../utils/generateZegoToken.js";

export const getVideoToken = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;

  if (!roomId) {
    return next(new ApiError(400, "Room ID is required"));
  }

  const appId = parseInt(process.env.ZEGO_APP_ID);
  const serverSecret = process.env.ZEGO_SERVER_SECRET;

  if (!appId || !serverSecret) {
    return next(new ApiError(500, "Video service not configured"));
  }

  const userId = req.user._id.toString();
  const userName = req.user.name || "Guest";

  const token = generateZegoToken(appId, serverSecret, roomId, userId, userName);

  res.status(200).json(
    new ApiResponse(200, { token, appId }, "Token generated successfully")
  );
});
