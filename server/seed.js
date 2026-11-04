import { configDotenv } from "dotenv";
configDotenv();

import { connectDatabase } from "./database/database.js";
import Employee from "./models/Employee.js";
import Assignment from "./models/Assignment.js";
import AppSettings from "./models/AppSettings.js";
import { DEFAULT_ASSIGNMENT_CRITERIA } from "./constants/positions.js";
import mongoose from "mongoose";

const sampleEmployees = [
    {
        name: "Hamza Ali",
        email: "hamza.ali@example.com",
        position: "Software Architect",
        experience: 12,
        department: "App dev",
        skills: ["JavaScript", "React", "Node.js", "System Design"]
    },
    {
        name: "Zakir Raza",
        email: "zakir.raza@example.com",
        position: "Lead Software Engineer",
        experience: 7,
        department: "App dev",
        skills: ["JavaScript", "React", "Node.js", "ExpressJS", "MongoDB"]
    },
    {
        name: "Ahmed Khan",
        email: "ahmed.khan@example.com",
        position: "Senior Software Engineer",
        experience: 5,
        department: "App dev",
        skills: ["React", "TypeScript", "Node.js"]
    },
    {
        name: "Usman Tariq",
        email: "usman.tariq@example.com",
        position: "Software Engineer",
        experience: 2,
        department: "App dev",
        skills: ["JavaScript", "React", "CSS"]
    },
    {
        name: "Bilal Ahmed",
        email: "bilal.ahmed@example.com",
        position: "Software Architect",
        experience: 15,
        department: "netSuite",
        skills: ["NetSuite", "JavaScript", "System Design", "ERP"]
    },
    {
        name: "Fahad Ali",
        email: "fahad.ali@example.com",
        position: "Lead Software Engineer",
        experience: 9,
        department: "netSuite",
        skills: ["NetSuite", "JavaScript", "Node.js", "SuiteScript"]
    },
    {
        name: "Hassan Raza",
        email: "hassan.raza@example.com",
        position: "Senior Software Engineer",
        experience: 6,
        department: "netSuite",
        skills: ["SuiteScript", "JavaScript", "NetSuite"]
    },
    {
        name: "Saad Malik",
        email: "saad.malik@example.com",
        position: "Software Engineer",
        experience: 3,
        department: "netSuite",
        skills: ["JavaScript", "SQL", "NetSuite"]
    },
    {
        name: "Adeel Shah",
        email: "adeel.shah@example.com",
        position: "Software Architect",
        experience: 14,
        department: "IT",
        skills: ["Cloud", "System Design", "AWS", "Security"]
    },
    {
        name: "Omer Farooq",
        email: "omer.farooq@example.com",
        position: "Lead Software Engineer",
        experience: 8,
        department: "IT",
        skills: ["Node.js", "Docker", "AWS", "DevOps"]
    },
    {
        name: "Waleed Khan",
        email: "waleed.khan@example.com",
        position: "Senior Software Engineer",
        experience: 6,
        department: "IT",
        skills: ["Node.js", "ExpressJS", "PostgreSQL"]
    },
    {
        name: "Danish Ahmed",
        email: "danish.ahmed@example.com",
        position: "Software Engineer",
        experience: 2,
        department: "IT",
        skills: ["JavaScript", "React", "Git"]
    }
];

async function seed() {
    await connectDatabase();

    // Drop legacy users collection from the previous auth design
    try {
        await mongoose.connection.collection("users").drop();
        console.log("Dropped legacy users collection");
    }
    catch {
        // collection may not exist
    }

    // Rebuild employee roster for the Employee-only isVerified auth model
    await Assignment.deleteMany({});
    await Employee.deleteMany({});
    console.log("Cleared employees and assignments for reseed");

    const hrEmail = (process.env.HR_SEED_EMAIL || "hr@example.com").toLowerCase();
    const hrName = process.env.HR_SEED_NAME || "HR Admin";

    await Employee.create({
        name: hrName,
        email: hrEmail,
        position: "HR",
        experience: 10,
        department: "HR",
        skills: ["People Ops", "Recruiting"],
        employeeManaged: 0,
        isVerified: true
    });
    console.log(`Created verified HR employee: ${hrEmail}`);

    await AppSettings.findOneAndUpdate(
        { key: "assignmentCriteria" },
        { key: "assignmentCriteria", ...DEFAULT_ASSIGNMENT_CRITERIA },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Employee.insertMany(sampleEmployees.map((employee) => ({
        ...employee,
        employeeManaged: 0,
        isVerified: true
    })));
    console.log(`Inserted ${sampleEmployees.length} verified sample employees`);

    console.log(`Seed complete. Sign in with Google using ${hrEmail} for HR access.`);
    process.exit(0);
}

seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
