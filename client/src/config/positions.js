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

export function isHR(position) {
    return position === "HR";
}

export function isLMCapable(position) {
    return LM_POSITIONS.includes(position);
}
