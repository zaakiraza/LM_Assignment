import express from "express";
import assignmentController from "../controllers/assignmentController.js";
import {
    requireAuth,
    requireVerified,
    requireHR,
    requireSelfOrHR
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth, requireVerified);

router.get("/", requireHR, assignmentController.getAssignments);
router.get("/pending", requireHR, assignmentController.getPendingAssignments);
router.get("/me/pending", assignmentController.getMyPendingAssignment);
router.get("/employee/:employeeId", assignmentController.getEmployeeAssignment);
router.patch("/bulk-confirm", requireHR, assignmentController.confirmAllAssignments);
router.patch("/bulk-reject", requireHR, assignmentController.rejectAllAssignments);
router.post("/", assignmentController.createAssignment);
router.patch("/:assignmentId/confirm", requireHR, assignmentController.confirmAssignment);
router.patch("/:assignmentId/reject", requireHR, assignmentController.rejectAssignment);
router.patch("/:assignmentId/cancel", assignmentController.cancelPendingAssignment);

export default router;
