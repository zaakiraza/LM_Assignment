import app from "./app.js";
import { configDotenv } from "dotenv";
import "./database/database.js";

configDotenv()
const PORT = process.env.PORT

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;