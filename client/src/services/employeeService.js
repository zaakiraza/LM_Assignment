import axios from "axios";

// const API_URL = "https://lm-assignment.vercel.app/api/employees";
const API_URL = "http://localhost:5000/api/employees"

class EmployeeService {

    async getEmployees() {
        const response = await axios.get(API_URL);
        return response.data.data;
    }

    async getEmployee(employeeId) {
        const response = await axios.get(`${API_URL}/${employeeId}`);
        return response.data.data;
    }

    async getAvailableLMs(employeeId, criteria) {
        const response = await axios.get(`${API_URL}/${employeeId}/available-lms`, {
            params: { criteria: JSON.stringify(criteria) }
        });
        return response.data.data;
    }

    async getAiRecommendation(employeeId, criteria) {
        const response = await axios.post(`${API_URL}/${employeeId}/ai-recommendation`, { criteria });
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

    async createEmployees(employees) {
        const response = await axios.post(`${API_URL}/bulk`, { employees });
        return response.data.data;
    }

    async importEmployees(file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(`${API_URL}/import`, formData);
        return response.data.data;
    }
}


export default new EmployeeService();