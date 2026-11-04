import api from "./api";

class AssignmentService {
    async getPendingAssignments() {
        const response = await api.get("/assignments/pending");
        return response.data.data;
    }

    async getMyPendingAssignment() {
        const response = await api.get("/assignments/me/pending");
        return response.data.data;
    }

    async getEmployeeAssignment(employeeId) {
        const response = await api.get(`/assignments/employee/${employeeId}`);
        return response.data.data;
    }

    async createAssignment(employeeId, lineManagerId, criteria) {
        const response = await api.post("/assignments", {
            employeeId,
            lineManagerId,
            criteria
        });
        return response.data.data;
    }

    async confirmAssignment(assignmentId, lineManagerId, criteria) {
        const response = await api.patch(`/assignments/${assignmentId}/confirm`, {
            lineManagerId,
            criteria
        });
        return response.data.data;
    }

    async rejectAssignment(assignmentId) {
        const response = await api.patch(`/assignments/${assignmentId}/reject`);
        return response.data.data;
    }

    async cancelPendingAssignment(assignmentId) {
        const response = await api.patch(`/assignments/${assignmentId}/cancel`);
        return response.data.data;
    }

    async confirmAllAssignments(criteria) {
        const response = await api.patch("/assignments/bulk-confirm", { criteria });
        return response.data.data;
    }

    async rejectAllAssignments() {
        const response = await api.patch("/assignments/bulk-reject");
        return response.data.data;
    }
}

export default new AssignmentService();
