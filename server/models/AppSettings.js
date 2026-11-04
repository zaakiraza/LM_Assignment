import mongoose from "mongoose";
import { DEFAULT_ASSIGNMENT_CRITERIA } from "../constants/positions.js";

const appSettingsSchema = new mongoose.Schema({
    key: { type: String, unique: true, default: "assignmentCriteria" },
    recommendationMode: {
        type: String,
        enum: ["criteria", "ai"],
        default: DEFAULT_ASSIGNMENT_CRITERIA.recommendationMode
    },
    maxManagedEmployees: {
        type: Number,
        default: DEFAULT_ASSIGNMENT_CRITERIA.maxManagedEmployees,
        min: 1
    },
    allowedDesignations: {
        type: [String],
        default: DEFAULT_ASSIGNMENT_CRITERIA.allowedDesignations
    },
    designationPriority: {
        type: [String],
        default: DEFAULT_ASSIGNMENT_CRITERIA.designationPriority
    },
    requireSameDepartment: {
        type: Boolean,
        default: DEFAULT_ASSIGNMENT_CRITERIA.requireSameDepartment
    }
}, {
    timestamps: true
});

export default mongoose.model("AppSettings", appSettingsSchema);
