import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["lm", "app"],
        required: true
    },
    fromEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true
    },
    toEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        default: null
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    }
}, {
    timestamps: true
});

feedbackSchema.index({ type: 1, createdAt: -1 });
feedbackSchema.index({ fromEmployeeId: 1, createdAt: -1 });
feedbackSchema.index({ toEmployeeId: 1, createdAt: -1 });

export default mongoose.model("Feedback", feedbackSchema);
