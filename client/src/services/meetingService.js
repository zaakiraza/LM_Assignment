import api from "./api";

const MeetingService = {
    async list() {
        const response = await api.get("/meetings");
        return response.data.data;
    },

    async create(payload) {
        const response = await api.post("/meetings", payload);
        return response.data.data;
    },

    async updateStatus(meetingId, status) {
        const response = await api.patch(`/meetings/${meetingId}/status`, { status });
        return response.data.data;
    }
};

export default MeetingService;
