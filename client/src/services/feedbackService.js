import api from "./api";

const FeedbackService = {
    async list(type) {
        const response = await api.get("/feedback", { params: type ? { type } : {} });
        return response.data.data;
    },

    async create(payload) {
        const response = await api.post("/feedback", payload);
        return response.data.data;
    }
};

export default FeedbackService;
