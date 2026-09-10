import axios from "axios";

const API_URL = "http://localhost:5000/api/assignments";

class AssignmentService {

    async getPendingAssignments() {
        const response = await axios.get(`${API_URL}/pending`);
        return response.data.data;
    }

    async getEmployeeAssignment(employeeId) {
        const response = await axios.get(`${API_URL}/employee/${employeeId}`);
        return response.data.data;
    }


    async createAssignment(employeeId, lineManagerId) {
        const response = await axios.post(
            API_URL,
            {
                employeeId,
                lineManagerId
            }
        );
        return response.data.data;
    }

    async confirmAssignment(assignmentId, lineManagerId) {
        const response = await axios.patch(`${API_URL}/${assignmentId}/confirm`, { lineManagerId });
        return response.data.data;
    }

    async rejectAssignment(assignmentId) {
        const response = await axios.patch(`${API_URL}/${assignmentId}/reject`);
        return response.data.data;
    }
}


export default new AssignmentService();