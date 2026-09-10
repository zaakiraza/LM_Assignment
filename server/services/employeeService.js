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

    getAvailableLMs(employeeId) {

        const employee = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(employeeId);
        if (!employee) {
            throw new Error("Employee does not exist");
        }

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
            WHERE department = ?
            AND designation IN (
                'Software Architect',
                'Lead Software Engineer'
            )
            AND employeeManaged < 4
            AND id != ?
            ORDER BY
                employeeManaged ASC,
                CASE
                    WHEN designation = 'Software Architect'
                    THEN 0
                    ELSE 1
                END ASC,
                id ASC
        `).all(
            employee.department,
            employeeId
        );
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