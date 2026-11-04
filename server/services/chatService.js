import Employee from "../models/Employee.js";
import Assignment from "../models/Assignment.js";
import { LM_POSITIONS } from "../constants/positions.js";

async function gatherWorkforceFacts() {
    const employees = await Employee.find();
    const assignments = await Assignment.find();
    const pending = assignments.filter((item) => !item.isConfirm);
    const active = assignments.filter((item) => item.isConfirm && item.isActive);

    const assignedEmployeeIds = new Set(active.map((item) => String(item.assignedEmpId)));
    const withoutLM = employees.filter((employee) => {
        if (employee.position === "HR") return false;
        return !assignedEmployeeIds.has(String(employee._id));
    });

    const byPosition = {};
    const byDepartment = {};
    for (const employee of employees) {
        byPosition[employee.position || "Unassigned"] = (byPosition[employee.position || "Unassigned"] || 0) + 1;
        byDepartment[employee.department || "Unassigned"] = (byDepartment[employee.department || "Unassigned"] || 0) + 1;
    }

    const managers = employees.filter((employee) => LM_POSITIONS.includes(employee.position));
    const managerLoad = managers.map((manager) => ({
        id: String(manager._id),
        name: manager.name,
        position: manager.position,
        department: manager.department,
        employeeManaged: manager.employeeManaged,
        assignees: active
            .filter((item) => String(item.lineManagerId) === String(manager._id))
            .map((item) => {
                const emp = employees.find((candidate) => String(candidate._id) === String(item.assignedEmpId));
                return emp ? { id: String(emp._id), name: emp.name, position: emp.position } : null;
            })
            .filter(Boolean)
    }));

    return {
        totalEmployees: employees.length,
        byPosition,
        byDepartment,
        pendingRequestCount: pending.length,
        activeAssignmentCount: active.length,
        employeesWithoutLMCount: withoutLM.length,
        employeesWithoutLM: withoutLM.map((employee) => ({
            id: String(employee._id),
            name: employee.name,
            position: employee.position,
            department: employee.department
        })),
        lineManagers: managerLoad
    };
}

class ChatService {
    async ask(question) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured on the server");
        }
        if (!question?.trim()) {
            throw new Error("A question is required");
        }

        const facts = await gatherWorkforceFacts();
        const prompt = `
            You are an HR data assistant for a line-manager assignment system.
            Answer only using the JSON facts below. If the facts do not contain the answer, say you do not have that data.
            Be concise and numeric when possible. Do not invent employees or counts.
            Facts: ${JSON.stringify(facts)}
            Question: ${question}
        `;

        process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

        // Lazy-load ADK so auth and other routes do not pay cold-start cost / crashes
        const { InMemoryRunner, LlmAgent, stringifyContent } = await import("@google/adk");

        const agent = new LlmAgent({
            name: "hr_workforce_assistant",
            model,
            instruction: prompt,
            includeContents: "none"
        });

        const runner = new InMemoryRunner({ agent, appName: "line_manager_hr_chat" });
        let responseText = "";
        for await (const event of runner.runEphemeral({
            userId: "hr-chat",
            newMessage: { role: "user", parts: [{ text: "Answer the HR question now using only the facts." }] }
        })) {
            if (event.errorMessage) {
                throw new Error(`AI model error: ${event.errorMessage}`);
            }
            const text = stringifyContent(event);
            if (text) responseText = text;
            if (!responseText && event.output) {
                responseText = typeof event.output === "string"
                    ? event.output
                    : JSON.stringify(event.output);
            }
        }

        if (!responseText) {
            throw new Error("AI returned an empty answer");
        }

        return {
            answer: responseText.trim(),
            factsSummary: {
                totalEmployees: facts.totalEmployees,
                pendingRequestCount: facts.pendingRequestCount,
                employeesWithoutLMCount: facts.employeesWithoutLMCount
            }
        };
    }
}

export default new ChatService();
