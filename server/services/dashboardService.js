import Employee from "../models/Employee.js";
import Assignment from "../models/Assignment.js";
import Meeting from "../models/Meeting.js";
import Feedback from "../models/Feedback.js";
import SettingsService from "./settingsService.js";
import { LM_POSITIONS, POSITIONS } from "../constants/positions.js";

class DashboardService {
    async getStats() {
        const [employees, assignments, criteria, upcomingMeetings, meetingsThisMonth, lmFeedback, appFeedbackCount] = await Promise.all([
            Employee.find().lean(),
            Assignment.find().sort({ updatedAt: -1 }).lean(),
            SettingsService.getCriteria(),
            Meeting.countDocuments({ status: "scheduled", scheduledAt: { $gte: new Date() } }),
            Meeting.countDocuments({
                scheduledAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }),
            Feedback.find({ type: "lm" }).select("rating").lean(),
            Feedback.countDocuments({ type: "app" })
        ]);

        const verified = employees.filter((employee) => employee.isVerified);
        const byId = new Map(employees.map((employee) => [String(employee._id), employee]));
        const active = assignments.filter((item) => item.isConfirm && item.isActive);
        const pending = assignments.filter((item) => !item.isConfirm);

        const assignedIds = new Set(active.map((item) => String(item.assignedEmpId)));
        const pendingIds = new Set(pending.map((item) => String(item.assignedEmpId)));

        // People who can have a line manager: verified, non-HR.
        const workforce = verified.filter((employee) => employee.position !== "HR");
        const assignedCount = workforce.filter((employee) => assignedIds.has(String(employee._id))).length;
        const pendingCount = workforce.filter((employee) =>
            !assignedIds.has(String(employee._id)) && pendingIds.has(String(employee._id))).length;
        const unassignedCount = workforce.length - assignedCount - pendingCount;

        const capacity = Number(criteria.maxManagedEmployees) || 0;
        const lineManagers = verified
            .filter((employee) => LM_POSITIONS.includes(employee.position))
            .map((manager) => {
                const managed = active.filter((item) => String(item.lineManagerId) === String(manager._id)).length;
                return {
                    id: String(manager._id),
                    name: manager.name,
                    position: manager.position,
                    department: manager.department,
                    managed,
                    capacity
                };
            })
            .sort((left, right) => right.managed - left.managed || left.name.localeCompare(right.name));

        const totalSlots = lineManagers.length * capacity;
        const usedSlots = lineManagers.reduce((sum, manager) => sum + manager.managed, 0);

        const departmentMap = new Map();
        for (const employee of workforce) {
            const key = employee.department || "Unassigned";
            const row = departmentMap.get(key) || { department: key, total: 0, assigned: 0 };
            row.total += 1;
            if (assignedIds.has(String(employee._id))) row.assigned += 1;
            departmentMap.set(key, row);
        }
        const byDepartment = [...departmentMap.values()]
            .map((row) => ({ ...row, unassigned: row.total - row.assigned }))
            .sort((left, right) => right.total - left.total);

        const byPosition = POSITIONS.map((position) => ({
            position,
            count: verified.filter((employee) => employee.position === position).length
        }));

        const ratings = lmFeedback.map((item) => item.rating).filter((rating) => Number.isFinite(rating));
        const averageLmRating = ratings.length
            ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
            : null;

        const recentAssignments = active.slice(0, 6).map((item) => ({
            id: String(item._id),
            employeeName: byId.get(String(item.assignedEmpId))?.name || "Removed employee",
            lineManagerName: byId.get(String(item.lineManagerId))?.name || "Removed manager",
            assignedAt: item.updatedAt
        }));

        return {
            totals: {
                employees: verified.length,
                workforce: workforce.length,
                lineManagers: lineManagers.length,
                assigned: assignedCount,
                pendingRequests: pending.length,
                withoutLM: unassignedCount + pendingCount,
                awaitingVerification: employees.length - verified.length,
                departments: new Set(verified.map((employee) => employee.department)).size
            },
            coverage: {
                assigned: assignedCount,
                pending: pendingCount,
                unassigned: unassignedCount
            },
            capacity: {
                perManager: capacity,
                totalSlots,
                usedSlots,
                availableSlots: Math.max(0, totalSlots - usedSlots),
                fullManagers: lineManagers.filter((manager) => capacity && manager.managed >= capacity).length
            },
            lineManagers,
            byDepartment,
            byPosition,
            engagement: {
                upcomingMeetings,
                meetingsThisMonth,
                lmFeedbackCount: lmFeedback.length,
                appFeedbackCount,
                averageLmRating
            },
            recentAssignments
        };
    }
}

export default new DashboardService();
