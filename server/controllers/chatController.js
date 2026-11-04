import ChatService from "../services/chatService.js";
import responseHandler from "../utils/responseHandler.js";

class ChatController {
    async ask(req, res) {
        try {
            const result = await ChatService.ask(req.body?.message || req.body?.question);
            return responseHandler.success(res, result, "Chat response generated");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to answer question", 400);
        }
    }
}

export default new ChatController();
