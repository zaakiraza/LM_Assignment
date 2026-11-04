import express from "express";
import dashboardController from "../controllers/dashboardController.js";
import { requireAuth, requireVerified, requireHR } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", requireAuth, requireVerified, requireHR, dashboardController.getStats);

export default router;
