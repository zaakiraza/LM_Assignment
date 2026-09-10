import express from "express";
import employeeController from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", employeeController.getEmployees);
router.post("/", employeeController.createEmployee);
router.put("/:employeeId", employeeController.updateEmployee);
router.delete("/:employeeId", employeeController.deleteEmployee);
router.get("/line-manager/:lineManagerId/assignees", employeeController.getAssignedEmployeesForManager);
router.get("/:employeeId/available-lms", employeeController.getAvailableLMs);
router.get("/:employeeId", employeeController.getEmployee);

export default router;