import EmployeeService from "../services/employeeService.js";
import responseHandler from "../utils/responseHandler.js";
import XLSX from "xlsx";
import AiRecommendationService from "../services/aiRecommendationService.js";
import { isHR, isLMCapable } from "../constants/positions.js";

class EmployeeController {
    async getEmployees(req, res) {
        try {
            const employees = await EmployeeService.getAllEmployees();
            return responseHandler.success(res, employees, "Employees fetched successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, "Failed to get employees", 500);
        }
    }

    async getEmployee(req, res) {
        try {
            const employee = await EmployeeService.getEmployeeById(req.params.employeeId);
            if (!employee) {
                return responseHandler.error(res, "Employee not found", 404);
            }
            return responseHandler.success(res, employee, "Employee fetched successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, "Failed to get employee", 500);
        }
    }

    async getMyProfile(req, res) {
        try {
            const employee = await EmployeeService.getEmployeeById(req.employee._id);
            if (!employee) {
                return responseHandler.error(res, "Employee profile not found", 404);
            }
            return responseHandler.success(res, employee, "Profile fetched successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, "Failed to get profile", 500);
        }
    }

    async getUnverifiedEmployees(req, res) {
        try {
            const employees = await EmployeeService.getUnverifiedEmployees();
            return responseHandler.success(res, employees, "Unverified employees fetched");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to list unverified employees", 400);
        }
    }

    async verifyEmployee(req, res) {
        try {
            const employee = await EmployeeService.verifyEmployee(req.params.employeeId, req.body);
            return responseHandler.success(res, employee, "Employee verified successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to verify employee", 400);
        }
    }

    async createEmployee(req, res) {
        try {
            const newEmployee = await EmployeeService.createEmployee(req.body);
            return responseHandler.success(res, newEmployee, "Employee created successfully", 201);
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to create employee", 400);
        }
    }

    async createEmployees(req, res) {
        try {
            const importedCount = await EmployeeService.createEmployees(req.body.employees);
            return responseHandler.success(res, { importedCount }, "Employees added successfully", 201);
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to add employees", 400);
        }
    }

    async importEmployees(req, res) {
        try {
            if (!req.file) {
                return responseHandler.error(res, "An Excel file is required", 400);
            }

            const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            const employees = rows.map((row) => ({
                name: row.name || row.Name,
                email: row.email || row.Email || undefined,
                position: row.position || row.Position || row.designation || row.Designation,
                experience: row.experience ?? row.Experience,
                department: row.department || row.Department,
                skills: row.skills || row.Skills || ""
            }));

            const importedCount = await EmployeeService.createEmployees(employees);
            return responseHandler.success(res, { importedCount }, "Employees imported successfully", 201);
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to import employees", 400);
        }
    }

    async updateEmployee(req, res) {
        try {
            const updatedEmployee = await EmployeeService.updateEmployee(req.params.employeeId, req.body);
            return responseHandler.success(res, updatedEmployee, "Employee updated successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    async deleteEmployee(req, res) {
        try {
            const result = await EmployeeService.deleteEmployee(req.params.employeeId);
            return responseHandler.success(res, result, "Employee deleted successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    async getAvailableLMs(req, res) {
        try {
            let criteria;
            if (req.query.criteria) {
                criteria = JSON.parse(req.query.criteria);
            }
            const lineManagers = await EmployeeService.getAvailableLMs(req.params.employeeId, criteria);
            return responseHandler.success(res, lineManagers, "Available Line Managers fetched successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    async getAiRecommendation(req, res) {
        try {
            const employeeId = req.params.employeeId;
            const employee = await EmployeeService.getEmployeeById(employeeId);
            if (!employee) {
                return responseHandler.error(res, "Employee not found", 404);
            }

            const criteria = req.body?.criteria || (req.query.criteria ? JSON.parse(req.query.criteria) : undefined);
            const candidates = await EmployeeService.getAvailableLMs(employeeId, criteria || {});
            const recommendation = await AiRecommendationService.recommendLineManager(employee, candidates, criteria);
            return responseHandler.success(res, recommendation, "AI Line Manager recommendation generated");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to generate AI recommendation", 400);
        }
    }

    async getAssignedEmployeesForManager(req, res) {
        try {
            const { lineManagerId } = req.params;
            const position = req.employee.position;
            const selfId = String(req.employee._id);

            if (!isHR(position) && String(lineManagerId) !== selfId) {
                return responseHandler.error(res, "You can only view your own assignees", 403);
            }

            if (!isHR(position) && !isLMCapable(position)) {
                return responseHandler.success(res, [], "Assigned employees fetched successfully");
            }

            const assignedEmployees = await EmployeeService.getAssignedEmployeesForManager(lineManagerId);
            return responseHandler.success(res, assignedEmployees, "Assigned employees fetched successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    async getMyAssignees(req, res) {
        try {
            const employeeId = req.employee._id;
            const position = req.employee.position;

            if (!isLMCapable(position) && !isHR(position)) {
                return responseHandler.success(res, [], "No assignees for this position");
            }

            const assignedEmployees = await EmployeeService.getAssignedEmployeesForManager(employeeId);
            return responseHandler.success(res, assignedEmployees, "Assigned employees fetched successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }
}

export default new EmployeeController();
