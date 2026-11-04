import AppSettings from "../models/AppSettings.js";
import { DEFAULT_ASSIGNMENT_CRITERIA } from "../constants/positions.js";

class SettingsService {
    toCriteria(doc) {
        if (!doc) return { ...DEFAULT_ASSIGNMENT_CRITERIA };
        return {
            recommendationMode: doc.recommendationMode,
            maxManagedEmployees: doc.maxManagedEmployees,
            allowedDesignations: [...doc.allowedDesignations],
            designationPriority: [...(doc.designationPriority?.length ? doc.designationPriority : doc.allowedDesignations)],
            requireSameDepartment: doc.requireSameDepartment
        };
    }

    async getCriteria() {
        let settings = await AppSettings.findOne({ key: "assignmentCriteria" });
        if (!settings) {
            settings = await AppSettings.create({
                key: "assignmentCriteria",
                ...DEFAULT_ASSIGNMENT_CRITERIA
            });
        }
        return this.toCriteria(settings);
    }

    async updateCriteria(criteria) {
        const allowedDesignations = Array.isArray(criteria.allowedDesignations)
            ? criteria.allowedDesignations
            : DEFAULT_ASSIGNMENT_CRITERIA.allowedDesignations;
        const designationPriority = Array.isArray(criteria.designationPriority) && criteria.designationPriority.length
            ? criteria.designationPriority
            : allowedDesignations;

        const settings = await AppSettings.findOneAndUpdate(
            { key: "assignmentCriteria" },
            {
                recommendationMode: criteria.recommendationMode === "ai" ? "ai" : "criteria",
                maxManagedEmployees: Number(criteria.maxManagedEmployees) || DEFAULT_ASSIGNMENT_CRITERIA.maxManagedEmployees,
                allowedDesignations,
                designationPriority,
                requireSameDepartment: criteria.requireSameDepartment !== false
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return this.toCriteria(settings);
    }
}

export default new SettingsService();
