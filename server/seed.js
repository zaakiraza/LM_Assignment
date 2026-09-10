import EmployeeService from "./services/employeeService.js";


const employees = [

    {
        id: 1,
        name: "Hamza Ali",
        designation: "Software Architect",
        experience: 12,
        department: "App dev",
        skills: [
            "JavaScript",
            "React",
            "Node.js",
            "System Design"
        ],
        employeeManaged: 0
    },

    {
        id: 2,
        name: "Zakir Raza",
        designation: "Lead Software Engineer",
        experience: 7,
        department: "App dev",
        skills: [
            "JavaScript",
            "React",
            "Node.js",
            "ExpressJS",
            "MongoDB"
        ],
        employeeManaged: 0
    },

    {
        id: 3,
        name: "Ahmed Khan",
        designation: "Senior Software Engineer",
        experience: 5,
        department: "App dev",
        skills: [
            "React",
            "TypeScript",
            "Node.js"
        ],
        employeeManaged: 0
    },

    {
        id: 4,
        name: "Usman Tariq",
        designation: "Software Engineer",
        experience: 2,
        department: "App dev",
        skills: [
            "JavaScript",
            "React",
            "CSS"
        ],
        employeeManaged: 0
    },

    {
        id: 5,
        name: "Bilal Ahmed",
        designation: "Software Architect",
        experience: 15,
        department: "netSuite",
        skills: [
            "NetSuite",
            "JavaScript",
            "System Design",
            "ERP"
        ],
        employeeManaged: 0
    },

    {
        id: 6,
        name: "Fahad Ali",
        designation: "Lead Software Engineer",
        experience: 9,
        department: "netSuite",
        skills: [
            "NetSuite",
            "JavaScript",
            "Node.js",
            "SuiteScript"
        ],
        employeeManaged: 0
    },

    {
        id: 7,
        name: "Hassan Raza",
        designation: "Senior Software Engineer",
        experience: 6,
        department: "netSuite",
        skills: [
            "SuiteScript",
            "JavaScript",
            "NetSuite"
        ],
        employeeManaged: 0
    },

    {
        id: 8,
        name: "Saad Malik",
        designation: "Software Engineer",
        experience: 3,
        department: "netSuite",
        skills: [
            "JavaScript",
            "SQL",
            "NetSuite"
        ],
        employeeManaged: 0
    },

    {
        id: 9,
        name: "Adeel Shah",
        designation: "Software Architect",
        experience: 14,
        department: "IT",
        skills: [
            "Cloud",
            "System Design",
            "AWS",
            "Security"
        ],
        employeeManaged: 0
    },

    {
        id: 10,
        name: "Omer Farooq",
        designation: "Lead Software Engineer",
        experience: 8,
        department: "IT",
        skills: [
            "Node.js",
            "Docker",
            "AWS",
            "DevOps"
        ],
        employeeManaged: 0
    },

    {
        id: 11,
        name: "Waleed Khan",
        designation: "Senior Software Engineer",
        experience: 6,
        department: "IT",
        skills: [
            "Node.js",
            "ExpressJS",
            "PostgreSQL"
        ],
        employeeManaged: 0
    },

    {
        id: 12,
        name: "Danish Ahmed",
        designation: "Software Engineer",
        experience: 2,
        department: "IT",
        skills: [
            "JavaScript",
            "React",
            "Git"
        ],
        employeeManaged: 0
    },

    {
        id: 13,
        name: "Rashid Mehmood",
        designation: "Senior Software Engineer",
        experience: 5,
        department: "App dev",
        skills: [
            "TypeScript",
            "React",
            "Next.js"
        ],
        employeeManaged: 0
    },

    {
        id: 14,
        name: "Talha Aslam",
        designation: "Software Engineer",
        experience: 1,
        department: "IT",
        skills: [
            "JavaScript",
            "HTML",
            "CSS"
        ],
        employeeManaged: 0
    },

    {
        id: 15,
        name: "Saif Ullah",
        designation: "Senior Software Engineer",
        experience: 4,
        department: "netSuite",
        skills: [
            "NetSuite",
            "JavaScript",
            "SQL"
        ],
        employeeManaged: 0
    }

];


for (const employee of employees) {
    EmployeeService.createEmployee(
        employee
    );
}


console.log(`${employees.length} employees created successfully`);