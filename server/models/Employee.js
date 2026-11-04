import mongoose from "mongoose";
import { POSITIONS } from "../constants/positions.js";

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true,
        default: undefined
    },
    avatar: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    position: {
        type: String,
        enum: POSITIONS,
        required: function requiredPosition() {
            return this.isVerified;
        }
    },
    experience: { type: Number, default: 0, min: 0 },
    department: {
        type: String,
        trim: true,
        default: "Unassigned",
        required: function requiredDepartment() {
            return this.isVerified;
        }
    },
    skills: { type: [String], default: [] },
    employeeManaged: { type: Number, default: 0, min: 0 }
}, {
    timestamps: true
});

export default mongoose.model("Employee", employeeSchema);
