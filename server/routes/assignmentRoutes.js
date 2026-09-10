import express from "express";
import assignmentController from "../controllers/assignmentController.js";

const router = express.Router();

router.get("/", assignmentController.getAssignments);
router.get("/pending", assignmentController.getPendingAssignments);
router.get("/employee/:employeeId", assignmentController.getEmployeeAssignment);
router.post("/", assignmentController.createAssignment);
router.patch("/:assignmentId/confirm", assignmentController.confirmAssignment);
router.patch("/:assignmentId/reject", assignmentController.rejectAssignment);

export default router;