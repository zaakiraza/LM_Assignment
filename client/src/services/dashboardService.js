import api from "./api";

class DashboardService {
    async getStats() {
        const response = await api.get("/dashboard/stats");
        return response.data.data;
    }
}

export default new DashboardService();
