import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 160
    },
    notes: {
        type: String,
        default: "",
        trim: true,
        maxlength: 4000
    },
    scheduledAt: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true
    },
    lineManagerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true
    },
    status: {
        type: String,
        enum: ["scheduled", "completed", "cancelled"],
        default: "scheduled"
    }
}, {
    timestamps: true
});

meetingSchema.index({ scheduledAt: 1 });
meetingSchema.index({ lineManagerId: 1, scheduledAt: -1 });
meetingSchema.index({ employeeId: 1, scheduledAt: -1 });

export default mongoose.model("Meeting", meetingSchema);
