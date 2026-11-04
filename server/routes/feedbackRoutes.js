import express from "express";
import feedbackController from "../controllers/feedbackController.js";
import { requireAuth, requireVerified } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth, requireVerified);
router.get("/", feedbackController.list);
router.post("/", feedbackController.create);

export default router;
