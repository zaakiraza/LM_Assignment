import express from "express";
import employeeController from "../controllers/employeeController.js";
import excelUpload from "../middleware/excelUploadMiddleware.js";
import {
    requireAuth,
    requireVerified,
    requireHR,
    requireSelfOrHR,
    requireLMOrHR
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/me", requireVerified, employeeController.getMyProfile);
router.get("/me/assignees", requireVerified, requireLMOrHR, employeeController.getMyAssignees);

router.get("/unverified", requireVerified, requireHR, employeeController.getUnverifiedEmployees);
router.patch("/:employeeId/verify", requireVerified, requireHR, employeeController.verifyEmployee);

router.post("/", requireVerified, requireHR, employeeController.createEmployee);
router.post("/bulk", requireVerified, requireHR, employeeController.createEmployees);
router.post("/import", requireVerified, requireHR, excelUpload, employeeController.importEmployees);
router.post("/:employeeId/ai-recommendation", requireVerified, requireHR, employeeController.getAiRecommendation);

router.put("/:employeeId", requireVerified, requireHR, employeeController.updateEmployee);
router.delete("/:employeeId", requireVerified, requireHR, employeeController.deleteEmployee);

router.get("/", requireVerified, employeeController.getEmployees);
router.get("/line-manager/:lineManagerId/assignees", requireVerified, requireLMOrHR, employeeController.getAssignedEmployeesForManager);
router.get("/:employeeId/available-lms", requireSelfOrHR("employeeId"), employeeController.getAvailableLMs);
router.get("/:employeeId", requireSelfOrHR("employeeId"), employeeController.getEmployee);

export default router;
