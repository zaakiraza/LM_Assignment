import express from "express";
import employeeController from "../controllers/employeeController.js";
import excelUpload from "../middleware/excelUploadMiddleware.js";

const router = express.Router();

router.post("/", employeeController.createEmployee);
router.post("/bulk", employeeController.createEmployees);
router.post("/import", excelUpload, employeeController.importEmployees);
router.post("/:employeeId/ai-recommendation", employeeController.getAiRecommendation);

router.put("/:employeeId", employeeController.updateEmployee);

router.delete("/:employeeId", employeeController.deleteEmployee);

router.get("/", employeeController.getEmployees);
router.get("/line-manager/:lineManagerId/assignees", employeeController.getAssignedEmployeesForManager);
router.get("/:employeeId/available-lms", employeeController.getAvailableLMs);
router.get("/:employeeId", employeeController.getEmployee);

export default router;