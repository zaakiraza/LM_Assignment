import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    assignedEmpId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true
    },
    lineManagerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null
    },
    isConfirm: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false }
}, {
    timestamps: true
});

assignmentSchema.index({ assignedEmpId: 1, isConfirm: 1 });
assignmentSchema.index({ lineManagerId: 1, isConfirm: 1, isActive: 1 });

export default mongoose.model("Assignment", assignmentSchema);
