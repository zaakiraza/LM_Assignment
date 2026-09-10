import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "line-manager.db");

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        designation TEXT NOT NULL,
        experience INTEGER NOT NULL,
        department TEXT NOT NULL,
        skills TEXT,
        employeeManaged INTEGER DEFAULT 0
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
        assignmentId INTEGER PRIMARY KEY AUTOINCREMENT,
        assignedEmpId INTEGER NOT NULL,
        lineManagerId INTEGER NOT NULL,
        isConfirm INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 0,
        FOREIGN KEY (assignedEmpId)
            REFERENCES employees(id),
        FOREIGN KEY (lineManagerId)
            REFERENCES employees(id)

    )
`);

export default db;