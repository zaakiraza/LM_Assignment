import express from "express";
import assignmentController from "../controllers/assignmentController.js";

const router = express.Router();

router.get("/", assignmentController.getAssignments);
router.get("/pending", assignmentController.getPendingAssignments);
router.get("/employee/:employeeId", assignmentController.getEmployeeAssignment);
router.patch("/bulk-confirm", assignmentController.confirmAllAssignments);
router.patch("/bulk-reject", assignmentController.rejectAllAssignments);
router.post("/", assignmentController.createAssignment);
router.patch("/:assignmentId/confirm", assignmentController.confirmAssignment);
router.patch("/:assignmentId/reject", assignmentController.rejectAssignment);
router.patch("/:assignmentId/cancel", assignmentController.cancelPendingAssignment);

export default router;