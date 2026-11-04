import express from "express";
import cors from "cors";
import employeeRoutes from "./routes/employeeRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true
}));
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Line Manager Assignment API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/meetings", meetingRoutes);

export default app;
