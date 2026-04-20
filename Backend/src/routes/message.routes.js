import express from "express";
import { sendMessage, getMessages, markMessagesAsRead, markMessagesAsDelivered } from "../controllers/message.controllers.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";

const router = express.Router();

router.post("/sendMessage", verifyJWT_username, sendMessage);
router.get("/getMessages/:chatId", verifyJWT_username, getMessages);
router.put("/read", verifyJWT_username, markMessagesAsRead);
router.put("/delivered", verifyJWT_username, markMessagesAsDelivered);

export default router;
