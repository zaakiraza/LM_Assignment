export const POSITIONS = [
    "HR",
    "Software Architect",
    "Lead Software Engineer",
    "Senior Software Engineer",
    "Software Engineer"
];

export const LM_POSITIONS = [
    "Software Architect",
    "Lead Software Engineer"
];

export const DEFAULT_ASSIGNMENT_CRITERIA = {
    recommendationMode: "criteria",
    maxManagedEmployees: 4,
    allowedDesignations: [...LM_POSITIONS],
    designationPriority: [...LM_POSITIONS],
    requireSameDepartment: true
};

export function isHR(position) {
    return position === "HR";
}

export function isLMCapable(position) {
    return LM_POSITIONS.includes(position);
}
