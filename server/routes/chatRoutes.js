import express from "express";
import chatController from "../controllers/chatController.js";
import { requireAuth, requireVerified, requireHR } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", requireAuth, requireVerified, requireHR, chatController.ask);

export default router;
