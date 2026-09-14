import db from "../database/database.js";

class EmployeeService {
    getAllEmployees() {
        const employees = db.prepare(` SELECT * FROM employees`).all();
        return employees;
    }

    getEmployeeById(id) {
        const employee = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(id);
        return employee;
    }

    createEmployee(employee) {
        const statement = db.prepare(`
                INSERT INTO employees (
                    id,
                    name,
                    designation,
                    experience,
                    department,
                    skills,
                    employeeManaged
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
        statement.run(
            employee.id,
            employee.name,
            employee.designation,
            employee.experience,
            employee.department,
            JSON.stringify(employee.skills || []),
            employee.employeeManaged || 0
        );

        return this.getEmployeeById(employee.id);
    }

    createEmployees(employees) {
        if (!Array.isArray(employees) || employees.length === 0) {
            throw new Error("At least one employee is required");
        }

        const insertEmployee = db.prepare(`
            INSERT INTO employees (
                id, name, designation, experience, department, skills, employeeManaged
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((records) => {
            records.forEach((employee) => {
                if (!employee.name || !employee.designation || employee.experience === undefined || !employee.department) {
                    throw new Error("Each employee must include name, designation, experience, and department");
                }

                insertEmployee.run(
                    employee.id || Date.now() + Math.floor(Math.random() * 100000),
                    employee.name,
                    employee.designation,
                    Number(employee.experience),
                    employee.department,
                    JSON.stringify(Array.isArray(employee.skills) ? employee.skills : String(employee.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean)),
                    0
                );
            });
        });

        transaction(employees);
        return employees.length;
    }

    updateEmployee(employeeId, employee) {
        const existingEmployee = this.getEmployeeById(employeeId);
        if (!existingEmployee) {
            throw new Error("Employee does not exist");
        }

        const statement = db.prepare(`
            UPDATE employees
            SET name = ?,
                designation = ?,
                experience = ?,
                department = ?,
                skills = ?,
                employeeManaged = ?
            WHERE id = ?
        `);

        statement.run(
            employee.name || existingEmployee.name,
            employee.designation || existingEmployee.designation,
            employee.experience ?? existingEmployee.experience,
            employee.department || existingEmployee.department,
            JSON.stringify(employee.skills || JSON.parse(existingEmployee.skills || "[]")),
            employee.employeeManaged ?? existingEmployee.employeeManaged,
            employeeId
        );

        return this.getEmployeeById(employeeId);
    }

    deleteEmployee(employeeId) {
        const existingEmployee = this.getEmployeeById(employeeId);
        if (!existingEmployee) {
            throw new Error("Employee does not exist");
        }

        const transaction = db.transaction(() => {
            const activeAssignment = db.prepare(`
                SELECT assignmentId, lineManagerId
                FROM assignments
                WHERE assignedEmpId = ?
                AND isConfirm = 1
                AND isActive = 1
            `).get(employeeId);

            if (activeAssignment?.lineManagerId) {
                db.prepare(`
                    UPDATE employees
                    SET employeeManaged = CASE
                        WHEN employeeManaged > 0 THEN employeeManaged - 1
                        ELSE 0
                    END
                    WHERE id = ?
                `).run(activeAssignment.lineManagerId);
            }

            db.prepare(`
                DELETE FROM assignments
                WHERE assignedEmpId = ?
                OR lineManagerId = ?
            `).run(employeeId, employeeId);

            db.prepare(`DELETE FROM employees WHERE id = ?`).run(employeeId);
        });

        transaction();

        return { deletedId: employeeId, deleted: true };
    }

    getAvailableLMs(employeeId, criteria = {}) {

        const employee = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(employeeId);
        if (!employee) {
            throw new Error("Employee does not exist");
        }

        const allowedDesignations = Array.isArray(criteria.allowedDesignations)
            ? criteria.allowedDesignations
            : [];
        const maxManagedEmployees = Number(criteria.maxManagedEmployees);
        const requireSameDepartment = criteria.requireSameDepartment !== false;

        if (!allowedDesignations.length || !Number.isFinite(maxManagedEmployees)) {
            throw new Error("Valid assignment criteria are required");
        }

        const designationPlaceholders = allowedDesignations.map(() => "?").join(", ");
        const departmentClause = requireSameDepartment ? "AND department = ?" : "";
        const queryParameters = requireSameDepartment
            ? [employee.department, ...allowedDesignations, maxManagedEmployees, employeeId]
            : [...allowedDesignations, maxManagedEmployees, employeeId];

        const lineManagers = db.prepare(`
            SELECT
                id,
                name,
                designation,
                experience,
                department,
                skills,
                employeeManaged
            FROM employees
            WHERE 1 = 1
            ${departmentClause}
            AND designation IN (${designationPlaceholders})
            AND employeeManaged < ?
            AND id != ?
            ORDER BY
                employeeManaged ASC,
                CASE
                    WHEN designation = 'Software Architect'
                    THEN 0
                    ELSE 1
                END ASC,
                id ASC
        `).all(...queryParameters);
        return lineManagers;
    }

    getAssignedEmployeesForManager(lineManagerId) {
        const lineManager = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(lineManagerId);
        if (!lineManager) {
            throw new Error("Line Manager does not exist");
        }

        return db.prepare(`
            SELECT
                e.id,
                e.name,
                e.designation,
                e.experience,
                e.department,
                e.skills,
                e.employeeManaged
            FROM assignments a
            JOIN employees e ON e.id = a.assignedEmpId
            WHERE a.lineManagerId = ?
            AND a.isConfirm = 1
            AND a.isActive = 1
            ORDER BY a.assignmentId ASC
        `).all(lineManagerId);
    }
}

export default new EmployeeService();