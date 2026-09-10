import EmployeeService from "../services/employeeService.js";
import responseHandler from "../utils/responseHandler.js";

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
            const lineManagers = EmployeeService.getAvailableLMs(Number(employeeId));
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