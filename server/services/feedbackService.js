import Feedback from "../models/Feedback.js";
import Assignment from "../models/Assignment.js";
import { serializeEmployee } from "../utils/serializers.js";

function serializeFeedback(doc) {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
        id: String(obj._id),
        type: obj.type,
        rating: obj.rating,
        message: obj.message,
        createdAt: obj.createdAt,
        fromEmployee: obj.fromEmployeeId?._id
            ? serializeEmployee(obj.fromEmployeeId)
            : null,
        toEmployee: obj.toEmployeeId?._id
            ? serializeEmployee(obj.toEmployeeId)
            : null,
        fromEmployeeId: obj.fromEmployeeId?._id
            ? String(obj.fromEmployeeId._id)
            : String(obj.fromEmployeeId || ""),
        toEmployeeId: obj.toEmployeeId?._id
            ? String(obj.toEmployeeId._id)
            : (obj.toEmployeeId ? String(obj.toEmployeeId) : null)
    };
}

class FeedbackService {
    async createFeedback({ type, fromEmployeeId, toEmployeeId, rating, message }) {
        if (!["lm", "app"].includes(type)) {
            throw new Error("Invalid feedback type");
        }
        if (!message?.trim()) {
            throw new Error("Feedback message is required");
        }

        let targetId = toEmployeeId || null;
        if (type === "lm") {
            if (!targetId) {
                const assignment = await Assignment.findOne({
                    assignedEmpId: fromEmployeeId,
                    isConfirm: true,
                    isActive: true
                });
                if (!assignment?.lineManagerId) {
                    throw new Error("You need an assigned line manager to submit LM feedback");
                }
                targetId = assignment.lineManagerId;
            }
        }

        const created = await Feedback.create({
            type,
            fromEmployeeId,
            toEmployeeId: type === "lm" ? targetId : null,
            rating: rating ? Number(rating) : null,
            message: message.trim()
        });

        const populated = await Feedback.findById(created._id)
            .populate("fromEmployeeId")
            .populate("toEmployeeId");
        return serializeFeedback(populated);
    }

    async listFeedback({ type, viewerId, isHR, isLM }) {
        const query = {};
        if (type) query.type = type;

        if (type === "app") {
            if (!isHR) {
                query.fromEmployeeId = viewerId;
            }
        }
        else if (type === "lm") {
            if (isHR) {
                // all LM feedback
            }
            else if (isLM) {
                query.$or = [
                    { fromEmployeeId: viewerId },
                    { toEmployeeId: viewerId }
                ];
            }
            else {
                query.fromEmployeeId = viewerId;
            }
        }

        const rows = await Feedback.find(query)
            .sort({ createdAt: -1 })
            .populate("fromEmployeeId")
            .populate("toEmployeeId");
        return rows.map(serializeFeedback);
    }
}

export default new FeedbackService();
