import SettingsService from "../services/settingsService.js";
import responseHandler from "../utils/responseHandler.js";

class SettingsController {
    async getCriteria(req, res) {
        try {
            const criteria = await SettingsService.getCriteria();
            return responseHandler.success(res, criteria, "Assignment criteria fetched");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to fetch criteria", 500);
        }
    }

    async updateCriteria(req, res) {
        try {
            const criteria = await SettingsService.updateCriteria(req.body || {});
            return responseHandler.success(res, criteria, "Assignment criteria updated");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to update criteria", 400);
        }
    }
}

export default new SettingsController();
