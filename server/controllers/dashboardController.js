import DashboardService from "../services/dashboardService.js";
import responseHandler from "../utils/responseHandler.js";

class DashboardController {
    async getStats(_req, res) {
        try {
            const stats = await DashboardService.getStats();
            return responseHandler.success(res, stats, "Dashboard stats fetched");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to load dashboard stats", 500);
        }
    }
}

export default new DashboardController();
