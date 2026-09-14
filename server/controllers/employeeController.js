import EmployeeService from "../services/employeeService.js";
import responseHandler from "../utils/responseHandler.js";
import XLSX from "xlsx";

class EmployeeController {

    getEmployees(req, res) {
        try {
            const employees = EmployeeService.getAllEmployees();
            return responseHandler.success(
                res,
                employees,
                "Employees fetched successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                "Failed to get employees",
                500
            );
        }
    }

    getEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const employee = EmployeeService.getEmployeeById(Number(employeeId));

            if (!employee) {
                return responseHandler.error(
                    res,
                    "Employee not found",
                    404
                );
            }

            return responseHandler.success(
                res,
                employee,
                "Employee fetched successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                "Failed to get employee",
                500
            );
        }
    }

    createEmployee(req, res) {
        try {
            const employee = req.body;
            const newEmployee = EmployeeService.createEmployee(
                employee
            );
            return responseHandler.success(
                res,
                newEmployee,
                "Employee created successfully",
                201
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                "Failed to create employee",
                500
            );
        }
    }

    createEmployees(req, res) {
        try {
            const importedCount = EmployeeService.createEmployees(req.body.employees);
            return responseHandler.success(res, { importedCount }, "Employees added successfully", 201);
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to add employees", 400);
        }
    }

    importEmployees(req, res) {
        try {
            if (!req.file) {
                return responseHandler.error(res, "An Excel file is required", 400);
            }

            const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            const employees = rows.map((row) => ({
                id: row.id || row.ID || undefined,
                name: row.name || row.Name,
                designation: row.designation || row.Designation,
                experience: row.experience ?? row.Experience,
                department: row.department || row.Department,
                skills: row.skills || row.Skills || ""
            }));

            const importedCount = EmployeeService.createEmployees(employees);
            return responseHandler.success(res, { importedCount }, "Employees imported successfully", 201);
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to import employees", 400);
        }
    }

    updateEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const employee = req.body;
            const updatedEmployee = EmployeeService.updateEmployee(Number(employeeId), employee);
            return responseHandler.success(
                res,
                updatedEmployee,
                "Employee updated successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                error.message,
                400
            );
        }
    }

    deleteEmployee(req, res) {
        try {
            const { employeeId } = req.params;
            const result = EmployeeService.deleteEmployee(Number(employeeId));
            return responseHandler.success(
                res,
                result,
                "Employee deleted successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                error.message,
                400
            );
        }
    }

    getAvailableLMs(req, res) {
        try {
            const { employeeId } = req.params;
            let criteria;
            if (req.query.criteria) {
                criteria = JSON.parse(req.query.criteria);
            }
            const lineManagers = EmployeeService.getAvailableLMs(Number(employeeId), criteria);
            return responseHandler.success(
                res,
                lineManagers,
                "Available Line Managers fetched successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                error.message,
                400
            );
        }
    }

    getAssignedEmployeesForManager(req, res) {
        try {
            const { lineManagerId } = req.params;
            const assignedEmployees = EmployeeService.getAssignedEmployeesForManager(Number(lineManagerId));

            return responseHandler.success(
                res,
                assignedEmployees,
                "Assigned employees fetched successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                error.message,
                400
            );
        }
    }
}

export default new EmployeeController();