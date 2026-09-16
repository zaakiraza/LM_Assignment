import db from "../database/database.js";


class AssignmentService {

    createAssignment(employeeId, lineManagerId, criteria = {}) {
        // 1. Check Employee exist
        const employee = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(employeeId);
        if (!employee) {
            throw new Error("Employee does not exist");
        }

        if (!lineManagerId) {
            const pendingRequest = db.prepare(`SELECT * FROM assignments WHERE assignedEmpId = ? AND isConfirm = 0`).get(employeeId);
            if (pendingRequest) {
                throw new Error("Employee already has a pending LM request");
            }

            const result = db.prepare(`
                INSERT INTO assignments (assignedEmpId, lineManagerId, isConfirm, isActive)
                VALUES (?, NULL, 0, 0)
            `).run(employeeId);

            return {
                assignmentId: result.lastInsertRowid,
                assignedEmpId: employeeId,
                lineManagerId: null,
                isConfirm: 0,
                isActive: 0
            };
        }

        // 2. Check LM exists
        const lineManager = db.prepare(`SELECT * FROM employees WHERE id = ?`).get(lineManagerId);
        if (!lineManager) {
            throw new Error("Line Manager does not exist");
        }

        // 3. Employee cannot be their own LM
        if (employeeId === lineManagerId) {
            throw new Error("Employee cannot be their own Line Manager");
        }

        // 4. Check LM designation
        const allowedDesignations = Array.isArray(criteria.allowedDesignations)
            ? criteria.allowedDesignations
            : [];
        const maxManagedEmployees = Number(criteria.maxManagedEmployees);
        const requireSameDepartment = criteria.requireSameDepartment !== false;
        const designationPriority = Array.isArray(criteria.designationPriority) && criteria.designationPriority.length
            ? criteria.designationPriority
            : allowedDesignations;

        if (!allowedDesignations.length || !Number.isFinite(maxManagedEmployees)) {
            throw new Error("Valid assignment criteria are required");
        }

        if (!allowedDesignations.includes(lineManager.designation)) {
            throw new Error("Selected employee cannot be a Line Manager");
        }

        const employeeRank = designationPriority.indexOf(employee.designation);
        const lineManagerRank = designationPriority.indexOf(lineManager.designation);
        const validHierarchy = employeeRank === -1 || lineManagerRank < employeeRank || (
            lineManagerRank === employeeRank && lineManager.experience > employee.experience
        );
        if (!validHierarchy) {
            throw new Error("Line Manager must have a higher designation or more experience at the same designation");
        }

        // 5. Check same department
        if (requireSameDepartment && employee.department !== lineManager.department) {
            throw new Error("Line Manager must belong to the same department");
        }

        // 6. Check LM capacity
        if (lineManager.employeeManaged >= maxManagedEmployees) {
            throw new Error("Line Manager has reached maximum capacity");
        }

        // 7. Check existing pending request
        const pendingRequest = db.prepare(`SELECT * FROM assignments WHERE assignedEmpId = ? AND isConfirm = 0`).get(employeeId);
        if (pendingRequest) {
            throw new Error("Employee already has a pending LM request");
        }

        // 8. Create pending request
        const statement = db.prepare(`
                INSERT INTO assignments (
                    assignedEmpId,
                    lineManagerId,
                    isConfirm,
                    isActive
                )
                VALUES (?, ?, 0, 0)
        `);

        const result = statement.run(employeeId, lineManagerId);

        return {
            assignmentId: result.lastInsertRowid,
            assignedEmpId: employeeId,
            lineManagerId: lineManagerId,
            isConfirm: 0,
            isActive: 0
        };
    }

    confirmAssignment(
        assignmentId,
        selectedLineManagerId,
        criteria = {}
    ) {

        const assignment =
            db.prepare(`
            SELECT *
            FROM assignments
            WHERE assignmentId = ?
            AND isConfirm = 0
        `).get(
                assignmentId
            );


        if (!assignment) {

            throw new Error(
                "Pending assignment not found"
            );

        }


        const employee =
            db.prepare(`
            SELECT *
            FROM employees
            WHERE id = ?
        `).get(
                assignment.assignedEmpId
            );


        if (!employee) {

            throw new Error(
                "Employee does not exist"
            );

        }


        const lineManagerId =
            selectedLineManagerId ||
            assignment.lineManagerId;


        const newLM =
            db.prepare(`
            SELECT *
            FROM employees
            WHERE id = ?
        `).get(
                lineManagerId
            );


        if (!newLM) {

            throw new Error(
                "Line Manager does not exist"
            );

        }


        /*
         * Check designation
         */
        const allowedDesignations = Array.isArray(criteria.allowedDesignations)
            ? criteria.allowedDesignations
            : [];
        const maxManagedEmployees = Number(criteria.maxManagedEmployees);
        const requireSameDepartment = criteria.requireSameDepartment !== false;

        if (!allowedDesignations.length || !Number.isFinite(maxManagedEmployees)) {
            throw new Error("Valid assignment criteria are required");
        }

        if (!allowedDesignations.includes(newLM.designation)) {

            throw new Error(
                "Selected employee cannot be a Line Manager"
            );

        }


        /*
         * Employee cannot be their own LM
         */
        if (
            newLM.id === employee.id
        ) {

            throw new Error(
                "Employee cannot be their own Line Manager"
            );

        }


        /*
         * Same department
         */
        if (requireSameDepartment && newLM.department !== employee.department) {

            throw new Error(
                "Line Manager must belong to the same department"
            );

        }


        /*
         * Find current active LM
         */
        const currentAssignment =
            db.prepare(`
            SELECT *
            FROM assignments
            WHERE assignedEmpId = ?
            AND isConfirm = 1
            AND isActive = 1
        `).get(
                employee.id
            );


        /*
         * If employee already has this
         * exact LM, don't increase count.
         */
        if (
            currentAssignment &&
            currentAssignment.lineManagerId ===
            newLM.id
        ) {

            throw new Error(
                "Employee is already assigned to this Line Manager"
            );

        }


        /*
         * Capacity check
         *
         * Only necessary when this is a
         * new/different LM.
         */
        if (newLM.employeeManaged >= maxManagedEmployees) {

            throw new Error(
                "Line Manager has reached maximum capacity"
            );

        }


        /*
         * Start transaction
         */
        const transaction =
            db.transaction(() => {

                /*
                 * If employee already has
                 * another LM, remove that
                 * relationship.
                 */
                if (
                    currentAssignment
                ) {

                    /*
                     * Decrease old LM count
                     */
                    db.prepare(`
                    UPDATE employees
                    SET employeeManaged =
                        CASE
                            WHEN employeeManaged > 0
                            THEN employeeManaged - 1
                            ELSE 0
                        END
                    WHERE id = ?
                `).run(
                        currentAssignment.lineManagerId
                    );


                    /*
                     * Make old assignment
                     * historical.
                     */
                    db.prepare(`
                    UPDATE assignments
                    SET isActive = 0
                    WHERE assignmentId = ?
                `).run(
                        currentAssignment.assignmentId
                    );

                }


                /*
                 * Confirm pending assignment
                 */
                db.prepare(`
                UPDATE assignments
                SET
                    lineManagerId = ?,
                    isConfirm = 1,
                    isActive = 1
                WHERE assignmentId = ?
            `).run(
                    newLM.id,
                    assignmentId
                );


                /*
                 * Increase new LM count
                 */
                db.prepare(`
                UPDATE employees
                SET employeeManaged =
                    employeeManaged + 1
                WHERE id = ?
            `).run(
                    newLM.id
                );

            });


        transaction();


        /*
         * Return confirmed assignment
         */
        return db.prepare(`
        SELECT
            a.assignmentId,
            a.assignedEmpId,

            employee.name AS employeeName,
            employee.department AS employeeDepartment,

            a.lineManagerId,

            lm.name AS lineManagerName,
            lm.designation AS lineManagerDesignation,
            lm.experience AS lineManagerExperience,
            lm.department AS lineManagerDepartment,
            lm.skills AS lineManagerSkills,
            lm.employeeManaged AS lineManagerEmployeeManaged,

            a.isConfirm,
            a.isActive

        FROM assignments a

        JOIN employees employee
            ON employee.id = a.assignedEmpId

        LEFT JOIN employees lm
            ON lm.id = a.lineManagerId

        WHERE a.assignmentId = ?
    `).get(
            assignmentId
        );

    }

    getAllAssignments() {
        return db.prepare(`SELECT * FROM assignments`).all();
    }

    getPendingAssignments() {
        return db.prepare(`SELECT * FROM assignments WHERE isConfirm = 0`).all();
    }

    getEmployeeAssignment(employeeId) {
        return db.prepare(`
        SELECT
            a.assignmentId,
            a.assignedEmpId,
            a.lineManagerId,
            a.isConfirm,
            a.isActive,

            lm.name AS lineManagerName,
            lm.designation AS lineManagerDesignation,
            lm.experience AS lineManagerExperience,
            lm.department AS lineManagerDepartment,
            lm.skills AS lineManagerSkills,
            lm.employeeManaged AS lineManagerEmployeeManaged

        FROM assignments a

        LEFT JOIN employees lm
            ON lm.id = a.lineManagerId

        WHERE a.assignedEmpId = ?
        AND a.isConfirm = 1
        AND a.isActive = 1

    `).get(employeeId);
    }

    rejectAssignment(assignmentId) {
        const assignment = db.prepare(`
            SELECT *
            FROM assignments
            WHERE assignmentId = ?
        `).get(assignmentId);

        if (!assignment) {
            throw new Error("Assignment not found");
        }

        if (assignment.isConfirm === 1 && assignment.isActive === 1) {
            const transaction = db.transaction(() => {
                db.prepare(`
                    UPDATE employees
                    SET employeeManaged = CASE
                        WHEN employeeManaged > 0 THEN employeeManaged - 1
                        ELSE 0
                    END
                    WHERE id = ?
                `).run(assignment.lineManagerId);

                db.prepare(`
                    UPDATE assignments
                    SET isConfirm = 0,
                        isActive = 0
                    WHERE assignmentId = ?
                `).run(assignmentId);
            });

            transaction();

            return {
                ...assignment,
                isConfirm: 0,
                isActive: 0,
                rejected: true
            };
        }

        db.prepare(`DELETE FROM assignments WHERE assignmentId = ?`).run(assignmentId);

        return {
            ...assignment,
            isConfirm: 0,
            isActive: 0,
            rejected: true,
            deleted: true
        };
    }

    cancelPendingAssignment(assignmentId) {
        const assignment = db.prepare(`
            SELECT *
            FROM assignments
            WHERE assignmentId = ?
            AND isConfirm = 0
        `).get(assignmentId);

        if (!assignment) {
            throw new Error("Pending assignment request not found");
        }

        db.prepare(`DELETE FROM assignments WHERE assignmentId = ?`).run(assignmentId);

        return {
            assignmentId,
            assignedEmpId: assignment.assignedEmpId,
            cancelled: true
        };
    }

    getPendingAssignments() {
        return db.prepare(`
        SELECT
            a.assignmentId,

            a.assignedEmpId,
            employee.name AS employeeName,
            employee.department AS employeeDepartment,

            a.lineManagerId,
            lm.name AS lineManagerName,
            lm.designation AS lineManagerDesignation,

            a.isConfirm,
            a.isActive

        FROM assignments a

        JOIN employees employee
            ON employee.id = a.assignedEmpId

        LEFT JOIN employees lm
            ON lm.id = a.lineManagerId

        WHERE a.isConfirm = 0

        ORDER BY a.assignmentId DESC
    `).all();
    }
}


export default new AssignmentService();