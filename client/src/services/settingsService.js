import api from "./api";

class SettingsService {
    async getCriteria() {
        const response = await api.get("/settings/criteria");
        return response.data.data;
    }

    async updateCriteria(criteria) {
        const response = await api.put("/settings/criteria", criteria);
        return response.data.data;
    }
}

export default new SettingsService();
