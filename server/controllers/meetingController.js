import MeetingService from "../services/meetingService.js";
import responseHandler from "../utils/responseHandler.js";
import { isHR, isLMCapable } from "../constants/positions.js";

class MeetingController {
    async create(req, res) {
        try {
            const position = req.employee.position;
            if (!isHR(position) && !isLMCapable(position)) {
                return responseHandler.error(res, "Only line managers or HR can schedule meetings", 403);
            }

            const meeting = await MeetingService.createMeeting({
                title: req.body.title,
                notes: req.body.notes,
                scheduledAt: req.body.scheduledAt,
                createdBy: req.employee._id,
                lineManagerId: req.body.lineManagerId,
                employeeId: req.body.employeeId,
                isHR: isHR(position)
            });
            return responseHandler.success(res, meeting, "Meeting scheduled", 201);
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to schedule meeting", 400);
        }
    }

    async list(req, res) {
        try {
            const position = req.employee.position;
            const rows = await MeetingService.listMeetings({
                viewerId: req.employee._id,
                isHR: isHR(position),
                isLM: isLMCapable(position)
            });
            return responseHandler.success(res, rows, "Meetings fetched");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to load meetings", 500);
        }
    }

    async updateStatus(req, res) {
        try {
            const position = req.employee.position;
            const meeting = await MeetingService.updateStatus(
                req.params.meetingId,
                req.body.status,
                req.employee._id,
                isHR(position)
            );
            return responseHandler.success(res, meeting, "Meeting updated");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to update meeting", 400);
        }
    }
}

export default new MeetingController();
