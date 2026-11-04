import { configDotenv } from "dotenv";
configDotenv();

import app from "./app.js";
import { connectDatabase } from "./database/database.js";

const PORT = process.env.PORT || 5000;
let dbReady = null;

function ensureDatabase() {
    if (!dbReady) {
        dbReady = connectDatabase().catch((error) => {
            dbReady = null;
            throw error;
        });
    }
    return dbReady;
}

function applyFallbackCors(req, res) {
    const origin = req.headers.origin;
    const allowed = String(process.env.CLIENT_URL || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

    if (!allowed.length || (origin && allowed.includes(origin))) {
        res.setHeader("Access-Control-Allow-Origin", origin || "*");
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function start() {
    if (process.env.VERCEL) {
        return;
    }

    await ensureDatabase();
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}

start().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});

export default async function handler(req, res) {
    try {
        if (req.method === "OPTIONS") {
            applyFallbackCors(req, res);
            res.statusCode = 204;
            res.end();
            return;
        }

        await ensureDatabase();
        return app(req, res);
    }
    catch (error) {
        console.error("Vercel handler failed:", error);
        applyFallbackCors(req, res);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
            success: false,
            message: error.message || "Server function failed"
        }));
    }
}
