import express from "express";
import { getVideoToken } from "../controllers/video.controllers.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";

const router = express.Router();

router.get("/token/:roomId", verifyJWT_username, getVideoToken);

export default router;
