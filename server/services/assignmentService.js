import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import Employee from "../models/Employee.js";
import { serializeAssignment } from "../utils/serializers.js";
import { LM_POSITIONS } from "../constants/positions.js";

class AssignmentService {
    async createAssignment(employeeId, lineManagerId, criteria = {}) {
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            throw new Error("Employee does not exist");
        }

        const pendingRequest = await Assignment.findOne({
            assignedEmpId: employeeId,
            isConfirm: false
        });
        if (pendingRequest) {
            throw new Error("Employee already has a pending LM request");
        }

        if (!lineManagerId) {
            const created = await Assignment.create({
                assignedEmpId: employeeId,
                lineManagerId: null,
                isConfirm: false,
                isActive: false
            });
            return serializeAssignment(created);
        }

        const lineManager = await Employee.findById(lineManagerId);
        if (!lineManager) {
            throw new Error("Line Manager does not exist");
        }

        if (String(employeeId) === String(lineManagerId)) {
            throw new Error("Employee cannot be their own Line Manager");
        }

        const allowedDesignations = Array.isArray(criteria.allowedDesignations)
            ? criteria.allowedDesignations
            : LM_POSITIONS;
        const maxManagedEmployees = Number(criteria.maxManagedEmployees);
        const requireSameDepartment = criteria.requireSameDepartment !== false;
        const designationPriority = Array.isArray(criteria.designationPriority) && criteria.designationPriority.length
            ? criteria.designationPriority
            : allowedDesignations;

        if (!allowedDesignations.length || !Number.isFinite(maxManagedEmployees)) {
            throw new Error("Valid assignment criteria are required");
        }

        if (!allowedDesignations.includes(lineManager.position)) {
            throw new Error("Selected employee cannot be a Line Manager");
        }

        const employeeRank = designationPriority.indexOf(employee.position);
        const lineManagerRank = designationPriority.indexOf(lineManager.position);
        const validHierarchy = employeeRank === -1 || lineManagerRank < employeeRank || (
            lineManagerRank === employeeRank && lineManager.experience > employee.experience
        );
        if (!validHierarchy) {
            throw new Error("Line Manager must have a higher designation or more experience at the same designation");
        }

        if (requireSameDepartment && employee.department !== lineManager.department) {
            throw new Error("Line Manager must belong to the same department");
        }

        if (lineManager.employeeManaged >= maxManagedEmployees) {
            throw new Error("Line Manager has reached maximum capacity");
        }

        const created = await Assignment.create({
            assignedEmpId: employeeId,
            lineManagerId,
            isConfirm: false,
            isActive: false
        });

        return serializeAssignment(created);
    }

    async confirmAssignment(assignmentId, selectedLineManagerId, criteria = {}) {
        if (!mongoose.isValidObjectId(assignmentId)) {
            throw new Error("Pending assignment not found");
        }

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            isConfirm: false
        });
        if (!assignment) {
            throw new Error("Pending assignment not found");
        }

        const employee = await Employee.findById(assignment.assignedEmpId);
        if (!employee) {
            throw new Error("Employee does not exist");
        }

        const lineManagerId = selectedLineManagerId || assignment.lineManagerId;
        const newLM = await Employee.findById(lineManagerId);
        if (!newLM) {
            throw new Error("Line Manager does not exist");
        }

        const allowedDesignations = Array.isArray(criteria.allowedDesignations)
            ? criteria.allowedDesignations
            : LM_POSITIONS;
        const maxManagedEmployees = Number(criteria.maxManagedEmployees);
        const requireSameDepartment = criteria.requireSameDepartment !== false;

        if (!allowedDesignations.length || !Number.isFinite(maxManagedEmployees)) {
            throw new Error("Valid assignment criteria are required");
        }

        if (!allowedDesignations.includes(newLM.position)) {
            throw new Error("Selected employee cannot be a Line Manager");
        }

        if (String(newLM._id) === String(employee._id)) {
            throw new Error("Employee cannot be their own Line Manager");
        }

        if (requireSameDepartment && newLM.department !== employee.department) {
            throw new Error("Line Manager must belong to the same department");
        }

        const currentAssignment = await Assignment.findOne({
            assignedEmpId: employee._id,
            isConfirm: true,
            isActive: true
        });

        if (currentAssignment && String(currentAssignment.lineManagerId) === String(newLM._id)) {
            throw new Error("Employee is already assigned to this Line Manager");
        }

        if (newLM.employeeManaged >= maxManagedEmployees) {
            throw new Error("Line Manager has reached maximum capacity");
        }

        if (currentAssignment) {
            const oldManager = await Employee.findById(currentAssignment.lineManagerId);
            if (oldManager) {
                oldManager.employeeManaged = Math.max(0, (oldManager.employeeManaged || 0) - 1);
                await oldManager.save();
            }
            currentAssignment.isActive = false;
            await currentAssignment.save();
        }

        assignment.lineManagerId = newLM._id;
        assignment.isConfirm = true;
        assignment.isActive = true;
        await assignment.save();

        newLM.employeeManaged = (newLM.employeeManaged || 0) + 1;
        await newLM.save();

        const refreshed = await Assignment.findById(assignmentId)
            .populate("assignedEmpId")
            .populate("lineManagerId");

        const employeeDoc = refreshed.assignedEmpId;
        const lmDoc = refreshed.lineManagerId;

        return {
            ...serializeAssignment(refreshed),
            employeeName: employeeDoc?.name,
            employeeDepartment: employeeDoc?.department,
            lineManagerName: lmDoc?.name,
            lineManagerDesignation: lmDoc?.position,
            lineManagerExperience: lmDoc?.experience,
            lineManagerDepartment: lmDoc?.department,
            lineManagerSkills: lmDoc?.skills,
            lineManagerEmployeeManaged: lmDoc?.employeeManaged
        };
    }

    async getAllAssignments() {
        const assignments = await Assignment.find();
        return assignments.map((assignment) => serializeAssignment(assignment));
    }

    async getPendingAssignments() {
        const assignments = await Assignment.find({ isConfirm: false })
            .sort({ createdAt: -1 })
            .populate("assignedEmpId")
            .populate("lineManagerId");

        return assignments.map((assignment) => ({
            ...serializeAssignment(assignment),
            employeeName: assignment.assignedEmpId?.name,
            employeeDepartment: assignment.assignedEmpId?.department,
            lineManagerName: assignment.lineManagerId?.name || null,
            lineManagerDesignation: assignment.lineManagerId?.position || null
        }));
    }

    async getEmployeeAssignment(employeeId) {
        const assignment = await Assignment.findOne({
            assignedEmpId: employeeId,
            isConfirm: true,
            isActive: true
        }).populate("lineManagerId");

        if (!assignment) return null;

        const lm = assignment.lineManagerId;
        return {
            ...serializeAssignment(assignment),
            lineManagerName: lm?.name,
            lineManagerDesignation: lm?.position,
            lineManagerExperience: lm?.experience,
            lineManagerDepartment: lm?.department,
            lineManagerSkills: lm?.skills,
            lineManagerEmployeeManaged: lm?.employeeManaged
        };
    }

    async getPendingAssignmentForEmployee(employeeId) {
        const assignment = await Assignment.findOne({
            assignedEmpId: employeeId,
            isConfirm: false
        }).populate("lineManagerId");

        if (!assignment) return null;

        return {
            ...serializeAssignment(assignment),
            lineManagerName: assignment.lineManagerId?.name || null,
            lineManagerDesignation: assignment.lineManagerId?.position || null
        };
    }

    async rejectAssignment(assignmentId) {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            throw new Error("Assignment not found");
        }

        if (assignment.isConfirm && assignment.isActive) {
            if (assignment.lineManagerId) {
                const manager = await Employee.findById(assignment.lineManagerId);
                if (manager) {
                    manager.employeeManaged = Math.max(0, (manager.employeeManaged || 0) - 1);
                    await manager.save();
                }
            }
            assignment.isConfirm = false;
            assignment.isActive = false;
            await assignment.save();

            return {
                ...serializeAssignment(assignment),
                rejected: true
            };
        }

        await Assignment.findByIdAndDelete(assignmentId);
        return {
            ...serializeAssignment(assignment),
            rejected: true,
            deleted: true
        };
    }

    async cancelPendingAssignment(assignmentId) {
        const assignment = await Assignment.findOne({
            _id: assignmentId,
            isConfirm: false
        });
        if (!assignment) {
            throw new Error("Pending assignment request not found");
        }

        await Assignment.findByIdAndDelete(assignmentId);
        return {
            assignmentId: String(assignmentId),
            assignedEmpId: String(assignment.assignedEmpId),
            cancelled: true
        };
    }
}

export default new AssignmentService();
