import { configDotenv } from "dotenv";
configDotenv();

import app from "./app.js";
import { connectDatabase } from "./database/database.js";

const PORT = process.env.PORT || 5000;

async function start() {
    await connectDatabase();

    if (!process.env.VERCEL) {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
}

start().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});

export default app;
