import express from "express";
import { rateUser } from "../controllers/rating.controllers.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";

const router = express.Router();

router.post("/rateUser", verifyJWT_username, rateUser);

export default router;
