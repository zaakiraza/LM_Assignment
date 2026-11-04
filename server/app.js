import express from "express";
import cors from "cors";
import employeeRoutes from "./routes/employeeRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

const allowedOrigins = String(process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Allow non-browser / same-origin tools (no Origin header)
        if (!origin) {
            return callback(null, true);
        }
        // If CLIENT_URL is unset, allow all (useful for quick deploys)
        if (!allowedOrigins.length) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
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
app.use("/api/dashboard", dashboardRoutes);

export default app;
