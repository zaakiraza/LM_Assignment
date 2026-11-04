import Meeting from "../models/Meeting.js";
import Assignment from "../models/Assignment.js";
import { serializeEmployee } from "../utils/serializers.js";

function serializeMeeting(doc) {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
        id: String(obj._id),
        title: obj.title,
        notes: obj.notes || "",
        scheduledAt: obj.scheduledAt,
        status: obj.status,
        createdAt: obj.createdAt,
        createdBy: obj.createdBy?._id ? serializeEmployee(obj.createdBy) : null,
        lineManager: obj.lineManagerId?._id ? serializeEmployee(obj.lineManagerId) : null,
        employee: obj.employeeId?._id ? serializeEmployee(obj.employeeId) : null,
        lineManagerId: obj.lineManagerId?._id ? String(obj.lineManagerId._id) : String(obj.lineManagerId || ""),
        employeeId: obj.employeeId?._id ? String(obj.employeeId._id) : String(obj.employeeId || "")
    };
}

class MeetingService {
    async createMeeting({ title, notes, scheduledAt, createdBy, lineManagerId, employeeId, isHR }) {
        if (!title?.trim()) throw new Error("Meeting title is required");
        if (!scheduledAt) throw new Error("Meeting date/time is required");
        if (!employeeId) throw new Error("Employee is required");

        let lmId = lineManagerId;
        if (!isHR) {
            lmId = createdBy;
            const assignment = await Assignment.findOne({
                assignedEmpId: employeeId,
                lineManagerId: createdBy,
                isConfirm: true,
                isActive: true
            });
            if (!assignment) {
                throw new Error("You can only schedule meetings with your assignees");
            }
        }
        else if (!lmId) {
            const assignment = await Assignment.findOne({
                assignedEmpId: employeeId,
                isConfirm: true,
                isActive: true
            });
            if (!assignment?.lineManagerId) {
                throw new Error("Selected employee has no assigned line manager");
            }
            lmId = assignment.lineManagerId;
        }

        const created = await Meeting.create({
            title: title.trim(),
            notes: notes?.trim() || "",
            scheduledAt: new Date(scheduledAt),
            createdBy,
            lineManagerId: lmId,
            employeeId,
            status: "scheduled"
        });

        const populated = await Meeting.findById(created._id)
            .populate("createdBy")
            .populate("lineManagerId")
            .populate("employeeId");
        return serializeMeeting(populated);
    }

    async listMeetings({ viewerId, isHR, isLM }) {
        let query = {};
        if (!isHR) {
            if (isLM) {
                query = {
                    $or: [
                        { lineManagerId: viewerId },
                        { employeeId: viewerId },
                        { createdBy: viewerId }
                    ]
                };
            }
            else {
                query = { employeeId: viewerId };
            }
        }

        const rows = await Meeting.find(query)
            .sort({ scheduledAt: -1 })
            .populate("createdBy")
            .populate("lineManagerId")
            .populate("employeeId");
        return rows.map(serializeMeeting);
    }

    async updateStatus(meetingId, status, viewerId, isHR) {
        if (!["scheduled", "completed", "cancelled"].includes(status)) {
            throw new Error("Invalid meeting status");
        }

        const meeting = await Meeting.findById(meetingId);
        if (!meeting) throw new Error("Meeting not found");

        const allowed = isHR
            || String(meeting.lineManagerId) === String(viewerId)
            || String(meeting.createdBy) === String(viewerId);
        if (!allowed) {
            throw new Error("Not allowed to update this meeting");
        }

        meeting.status = status;
        await meeting.save();

        const populated = await Meeting.findById(meeting._id)
            .populate("createdBy")
            .populate("lineManagerId")
            .populate("employeeId");
        return serializeMeeting(populated);
    }
}

export default new MeetingService();
