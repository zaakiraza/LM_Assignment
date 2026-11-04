// Legacy user linking removed — verification now lives on Employee.
// Kept as a thin re-export so old imports do not break during transition.
import EmployeeService from "./employeeService";

class UserService {
    async listPending() {
        return EmployeeService.getUnverifiedEmployees();
    }

    async verifyEmployee(employeeId, details) {
        return EmployeeService.verifyEmployee(employeeId, details);
    }
}

export default new UserService();
