import { configDotenv } from "dotenv";
configDotenv();

import app from "./app.js";
import { connectDatabase } from "./database/database.js";

const PORT = process.env.PORT || 5000;
let dbReady = null;

function ensureDatabase() {
    if (!dbReady) {
        dbReady = connectDatabase();
    }
    return dbReady;
}

async function start() {
    await ensureDatabase();

    if (!process.env.VERCEL) {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
}

start().catch((error) => {
    console.error("Failed to start server:", error);
    if (!process.env.VERCEL) {
        process.exit(1);
    }
});

export default async function handler(req, res) {
    await ensureDatabase();
    return app(req, res);
}
