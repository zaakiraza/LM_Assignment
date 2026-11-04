import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Assignment from "../models/Assignment.js";
import { serializeEmployee } from "../utils/serializers.js";
import { LM_POSITIONS, POSITIONS } from "../constants/positions.js";

function normalizeSkills(skills) {
    if (Array.isArray(skills)) {
        return skills.map((skill) => String(skill).trim()).filter(Boolean);
    }
    return String(skills || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
}

function resolvePosition(employee) {
    return employee.position || employee.designation;
}

class EmployeeService {
    async loginWithGoogle({ googleId, email, name, avatar }) {
        const normalizedEmail = String(email).toLowerCase().trim();
        let employee = await Employee.findOne({
            $or: [
                { email: normalizedEmail },
                { googleId }
            ]
        });

        if (!employee) {
            employee = await Employee.create({
                name: name || normalizedEmail,
                email: normalizedEmail,
                googleId,
                avatar: avatar || "",
                isVerified: false,
                experience: 0,
                department: "Unassigned",
                skills: [],
                employeeManaged: 0
            });
            return employee;
        }

        employee.googleId = googleId;
        employee.avatar = avatar || employee.avatar;
        if (!employee.name) employee.name = name;
        employee.email = normalizedEmail;
        await employee.save();
        return employee;
    }

    async getUnverifiedEmployees() {
        const employees = await Employee.find({ isVerified: false }).sort({ createdAt: -1 });
        return employees.map(serializeEmployee);
    }

    async verifyEmployee(employeeId, details = {}) {
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            throw new Error("Employee does not exist");
        }

        const position = resolvePosition(details);
        if (!position || !POSITIONS.includes(position)) {
            throw new Error("A valid position is required to verify an employee");
        }
        if (details.experience === undefined || details.experience === null || details.experience === "") {
            throw new Error("Experience is required to verify an employee");
        }
        if (!details.department?.trim()) {
            throw new Error("Department is required to verify an employee");
        }

        employee.name = details.name?.trim() || employee.name;
        employee.position = position;
        employee.experience = Number(details.experience);
        employee.department = details.department.trim();
        employee.skills = details.skills !== undefined
            ? normalizeSkills(details.skills)
            : employee.skills;
        if (details.email) {
            employee.email = String(details.email).toLowerCase().trim();
        }
        employee.isVerified = true;
        await employee.save();
        return serializeEmployee(employee);
    }

    async getAllEmployees() {
        const employees = await Employee.find().sort({ name: 1 });
        return employees.map(serializeEmployee);
    }

    async getEmployeeById(id) {
        if (!mongoose.isValidObjectId(id)) return null;
        const employee = await Employee.findById(id);
        return serializeEmployee(employee);
    }

    async getEmployeeDocument(id) {
        if (!mongoose.isValidObjectId(id)) return null;
        return Employee.findById(id);
    }

    async createEmployee(employee) {
        const position = resolvePosition(employee);
        if (!employee.name || !position || employee.experience === undefined || !employee.department) {
            throw new Error("Employee must include name, position, experience, and department");
        }
        if (!employee.email) {
            throw new Error("Employee email is required");
        }

        const created = await Employee.create({
            name: employee.name,
            email: String(employee.email).toLowerCase().trim(),
            position,
            experience: Number(employee.experience),
            department: employee.department,
            skills: normalizeSkills(employee.skills),
            employeeManaged: employee.employeeManaged || 0,
            isVerified: employee.isVerified !== false
        });

        return serializeEmployee(created);
    }

    async createEmployees(employees) {
        if (!Array.isArray(employees) || employees.length === 0) {
            throw new Error("At least one employee is required");
        }

        const docs = employees.map((employee) => {
            const position = resolvePosition(employee);
            if (!employee.name || !position || employee.experience === undefined || !employee.department) {
                throw new Error("Each employee must include name, position, experience, and department");
            }
            if (!employee.email) {
                throw new Error("Each employee must include an email");
            }
            return {
                name: employee.name,
                email: String(employee.email).toLowerCase().trim(),
                position,
                experience: Number(employee.experience),
                department: employee.department,
                skills: normalizeSkills(employee.skills),
                employeeManaged: 0,
                isVerified: true
            };
        });

        const created = await Employee.insertMany(docs, { ordered: true });
        return created.length;
    }

    async updateEmployee(employeeId, employee) {
        const existing = await Employee.findById(employeeId);
        if (!existing) {
            throw new Error("Employee does not exist");
        }

        existing.name = employee.name || existing.name;
        existing.position = resolvePosition(employee) || existing.position;
        existing.experience = employee.experience ?? existing.experience;
        existing.department = employee.department || existing.department;
        if (employee.email !== undefined) {
            existing.email = String(employee.email).toLowerCase().trim();
        }
        if (employee.skills !== undefined) {
            existing.skills = normalizeSkills(employee.skills);
        }
        if (employee.employeeManaged !== undefined) {
            existing.employeeManaged = employee.employeeManaged;
        }
        if (employee.isVerified !== undefined) {
            existing.isVerified = Boolean(employee.isVerified);
        }

        await existing.save();
        return serializeEmployee(existing);
    }

    async deleteEmployee(employeeId) {
        const existing = await Employee.findById(employeeId);
        if (!existing) {
            throw new Error("Employee does not exist");
        }

        const activeAssignment = await Assignment.findOne({
            assignedEmpId: employeeId,
            isConfirm: true,
            isActive: true
        });

        if (activeAssignment?.lineManagerId) {
            const manager = await Employee.findById(activeAssignment.lineManagerId);
            if (manager) {
                manager.employeeManaged = Math.max(0, (manager.employeeManaged || 0) - 1);
                await manager.save();
            }
        }

        await Assignment.deleteMany({
            $or: [
                { assignedEmpId: employeeId },
                { lineManagerId: employeeId }
            ]
        });

        await Employee.findByIdAndDelete(employeeId);

        return { deletedId: String(employeeId), deleted: true };
    }

    async getAvailableLMs(employeeId, criteria = {}) {
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            throw new Error("Employee does not exist");
        }

        const allowedDesignations = Array.isArray(criteria.allowedDesignations)
            ? criteria.allowedDesignations
            : LM_POSITIONS;
        const maxManagedEmployees = Number(criteria.maxManagedEmployees);
        const requireSameDepartment = criteria.requireSameDepartment !== false;

        if (!allowedDesignations.length || !Number.isFinite(maxManagedEmployees)) {
            throw new Error("Valid assignment criteria are required");
        }

        const query = {
            isVerified: true,
            position: { $in: allowedDesignations },
            employeeManaged: { $lt: maxManagedEmployees },
            _id: { $ne: employee._id }
        };

        if (requireSameDepartment) {
            query.department = employee.department;
        }

        const lineManagers = await Employee.find(query);
        const designationPriority = Array.isArray(criteria.designationPriority) && criteria.designationPriority.length
            ? criteria.designationPriority
            : allowedDesignations;
        const employeeRank = designationPriority.indexOf(employee.position);

        return lineManagers
            .filter((lineManager) => {
                const lineManagerRank = designationPriority.indexOf(lineManager.position);
                return employeeRank === -1 || lineManagerRank < employeeRank || (
                    lineManagerRank === employeeRank && lineManager.experience > employee.experience
                );
            })
            .sort((left, right) => {
                const leftRank = designationPriority.indexOf(left.position);
                const rightRank = designationPriority.indexOf(right.position);
                const leftIsHigher = leftRank < employeeRank;
                const rightIsHigher = rightRank < employeeRank;

                if (leftIsHigher !== rightIsHigher) return leftIsHigher ? -1 : 1;
                if (leftRank !== rightRank) return leftRank - rightRank;
                if (right.experience !== left.experience) return right.experience - left.experience;
                if (left.employeeManaged !== right.employeeManaged) return left.employeeManaged - right.employeeManaged;
                return String(left._id).localeCompare(String(right._id));
            })
            .map(serializeEmployee);
    }

    async getAssignedEmployeesForManager(lineManagerId) {
        const lineManager = await Employee.findById(lineManagerId);
        if (!lineManager) {
            throw new Error("Line Manager does not exist");
        }

        if (!LM_POSITIONS.includes(lineManager.position)) {
            return [];
        }

        const assignments = await Assignment.find({
            lineManagerId,
            isConfirm: true,
            isActive: true
        }).sort({ createdAt: 1 }).populate("assignedEmpId");

        return assignments
            .map((assignment) => serializeEmployee(assignment.assignedEmpId))
            .filter(Boolean);
    }
}

export default new EmployeeService();
