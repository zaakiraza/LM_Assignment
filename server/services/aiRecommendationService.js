import { InMemoryRunner, LlmAgent, stringifyContent } from "@google/adk";

function parseRecommendation(responseText) {
    const cleanedText = responseText
        .replace(/```(?:json)?/gi, "")
        .replace(/```/g, "")
        .trim();

    const jsonStart = cleanedText.indexOf("{");
    const jsonEnd = cleanedText.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
        throw new Error("AI response did not contain a JSON recommendation");
    }

    return JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1));
}

class AiRecommendationService {
    async recommendLineManager(employee, candidates, criteria) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured on the server");
        }
        if (!candidates.length) {
            throw new Error("No eligible Line Manager candidates are available");
        }

        const prompt = `
            You recommend a line manager for one employee. Choose exactly one candidate from the supplied list.
            Candidates already pass department, designation, and capacity constraints. Use skills first, then experience, then current load.
            Designation priority from highest to lowest is: Software Architect, Lead Software Engineer, Senior Software Engineer, Software Engineer.
            Prefer a candidate with a higher designation than the employee. If no higher designation is available, choose the same designation only when the candidate has more experience.
            Never choose a lower designation or a same-designation candidate with equal or less experience.
            Criteria: ${JSON.stringify(criteria)}
            Employee: ${JSON.stringify(employee)}
            Candidates: ${JSON.stringify(candidates)}
            Return only JSON: {"lineManagerId":123,"reason":"short explanation"}
        `;

        process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
        const agent = new LlmAgent({
            name: "line_manager_recommender",
            model: "gemini-3.6-flash",
            instruction: prompt,
            generateContentConfig: { responseMimeType: "application/json" },
            includeContents: "none"
        });

        const runner = new InMemoryRunner({ agent, appName: "line_manager_assignment" });
        let responseText = "";
        for await (const event of runner.runEphemeral({
            userId: "line-manager-dashboard",
            newMessage: { role: "user", parts: [{ text: "Return the recommendation JSON now." }] }
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

        let recommendation;
        try {
            recommendation = parseRecommendation(responseText);
        }
        catch (error) {
            console.error("Invalid AI recommendation response:", responseText);
            throw new Error(`AI returned an invalid recommendation: ${error.message}`);
        }

        const selectedCandidate = candidates.find(
            (candidate) => candidate.id === Number(recommendation.lineManagerId)
        );
        if (!selectedCandidate) {
            throw new Error("AI returned a Line Manager outside the eligible candidates");
        }

        return {
            ...selectedCandidate,
            recommendationReason: recommendation.reason || "Recommended based on skills and manager availability"
        };
    }
}

export default new AiRecommendationService();