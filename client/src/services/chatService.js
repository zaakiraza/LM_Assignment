import api from "./api";

class ChatService {
    async ask(message) {
        const response = await api.post("/chat", { message });
        return response.data.data;
    }
}

export default new ChatService();
