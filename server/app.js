import express from "express";
import cors from "cors";
import employeeRoutes from "./routes/employeeRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Line Manager Assignment API is running"
    });
});

app.use("/api/employees", employeeRoutes);
app.use("/api/assignments", assignmentRoutes);

export default app;