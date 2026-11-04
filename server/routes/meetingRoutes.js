import express from "express";
import meetingController from "../controllers/meetingController.js";
import { requireAuth, requireVerified } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth, requireVerified);
router.get("/", meetingController.list);
router.post("/", meetingController.create);
router.patch("/:meetingId/status", meetingController.updateStatus);

export default router;
