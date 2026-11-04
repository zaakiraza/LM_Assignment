import express from "express";
import settingsController from "../controllers/settingsController.js";
import { requireAuth, requireVerified, requireHR } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/criteria", requireAuth, requireVerified, requireHR, settingsController.getCriteria);
router.put("/criteria", requireAuth, requireVerified, requireHR, settingsController.updateCriteria);

export default router;
