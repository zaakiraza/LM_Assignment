import api from "./api";

class EmployeeService {
    async getEmployees() {
        const response = await api.get("/employees");
        return response.data.data;
    }

    async getMyProfile() {
        const response = await api.get("/employees/me");
        return response.data.data;
    }

    async getUnverifiedEmployees() {
        const response = await api.get("/employees/unverified");
        return response.data.data;
    }

    async verifyEmployee(employeeId, details) {
        const response = await api.patch(`/employees/${employeeId}/verify`, details);
        return response.data.data;
    }

    async getMyAssignees() {
        const response = await api.get("/employees/me/assignees");
        return response.data.data;
    }

    async getEmployee(employeeId) {
        const response = await api.get(`/employees/${employeeId}`);
        return response.data.data;
    }

    async getAvailableLMs(employeeId, criteria) {
        const response = await api.get(`/employees/${employeeId}/available-lms`, {
            params: { criteria: JSON.stringify(criteria) }
        });
        return response.data.data;
    }

    async getAiRecommendation(employeeId, criteria) {
        const response = await api.post(`/employees/${employeeId}/ai-recommendation`, { criteria });
        return response.data.data;
    }

    async getLineManagerAssignees(lineManagerId) {
        const response = await api.get(`/employees/line-manager/${lineManagerId}/assignees`);
        return response.data.data;
    }

    async updateEmployee(employeeId, employee) {
        const response = await api.put(`/employees/${employeeId}`, employee);
        return response.data.data;
    }

    async deleteEmployee(employeeId) {
        const response = await api.delete(`/employees/${employeeId}`);
        return response.data.data;
    }

    async createEmployee(employee) {
        const response = await api.post("/employees", employee);
        return response.data.data;
    }

    async createEmployees(employees) {
        const response = await api.post("/employees/bulk", { employees });
        return response.data.data;
    }

    async importEmployees(file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post("/employees/import", formData);
        return response.data.data;
    }
}

export default new EmployeeService();
