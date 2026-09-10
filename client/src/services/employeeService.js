import axios from "axios";

const API_URL = "http://localhost:5000/api/employees";

class EmployeeService {

    async getEmployees() {
        const response = await axios.get(API_URL);
        return response.data.data;
    }

    async getEmployee(employeeId) {
        const response = await axios.get(`${API_URL}/${employeeId}`);
        return response.data.data;
    }

    async getAvailableLMs(employeeId) {
        const response = await axios.get(`${API_URL}/${employeeId}/available-lms`);
        return response.data.data;
    }

    async getLineManagerAssignees(lineManagerId) {
        const response = await axios.get(`${API_URL}/line-manager/${lineManagerId}/assignees`);
        return response.data.data;
    }

    async updateEmployee(employeeId, employee) {
        const response = await axios.put(`${API_URL}/${employeeId}`, employee);
        return response.data.data;
    }

    async deleteEmployee(employeeId) {
        const response = await axios.delete(`${API_URL}/${employeeId}`);
        return response.data.data;
    }

    async createEmployee(employee) {
        const response = await axios.post(
            API_URL,
            employee
        );
        return response.data.data;
    }
}


export default new EmployeeService();