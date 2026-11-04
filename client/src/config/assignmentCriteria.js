import { LM_POSITIONS } from "./positions";

export const defaultAssignmentCriteria = {
    recommendationMode: "criteria",
    maxManagedEmployees: 4,
    allowedDesignations: [...LM_POSITIONS],
    designationPriority: [...LM_POSITIONS],
    requireSameDepartment: true
};
