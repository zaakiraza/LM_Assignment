import FeedbackService from "../services/feedbackService.js";
import responseHandler from "../utils/responseHandler.js";
import { isHR, isLMCapable } from "../constants/positions.js";

class FeedbackController {
    async create(req, res) {
        try {
            const feedback = await FeedbackService.createFeedback({
                type: req.body.type,
                fromEmployeeId: req.employee._id,
                toEmployeeId: req.body.toEmployeeId,
                rating: req.body.rating,
                message: req.body.message
            });
            return responseHandler.success(res, feedback, "Feedback submitted", 201);
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to submit feedback", 400);
        }
    }

    async list(req, res) {
        try {
            const position = req.employee.position;
            const rows = await FeedbackService.listFeedback({
                type: req.query.type,
                viewerId: req.employee._id,
                isHR: isHR(position),
                isLM: isLMCapable(position)
            });
            return responseHandler.success(res, rows, "Feedback fetched");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to load feedback", 500);
        }
    }
}

export default new FeedbackController();
