import AssignmentService from "../services/assignmentService.js";
import responseHandler from "../utils/responseHandler.js";

class AssignmentController {

    createAssignment(req, res) {
        try {
            const { employeeId, lineManagerId, criteria } = req.body;
            if (!employeeId || !lineManagerId) {
                return responseHandler.error(
                    res,
                    "employeeId and lineManagerId are required",
                    400
                );
            }
            const assignment = AssignmentService.createAssignment(employeeId, lineManagerId, criteria);
            return responseHandler.success(
                res,
                assignment,
                "LM assignment request created successfully",
                201
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                "Failed to create assignment request",
                500
            );
        }
    }

    confirmAssignment(req, res) {

        try {

            const {
                lineManagerId,
                criteria
            } = req.body;

            const assignmentId =
                Number(req.params.assignmentId);


            const assignment =
                AssignmentService.confirmAssignment(
                    assignmentId,
                    lineManagerId,
                    criteria
                );


            return responseHandler.success(
                res,
                assignment,
                "Line Manager assigned successfully"
            );

        }
        catch (error) {

            console.error(error);

            return responseHandler.error(
                res,
                error.message
            );
        }
    }

    rejectAssignment(req, res) {
        try {
            const assignmentId = Number(req.params.assignmentId);
            const rejectedAssignment = AssignmentService.rejectAssignment(assignmentId);

            return responseHandler.success(
                res,
                rejectedAssignment,
                "Assignment rejected successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                error.message,
                400
            );
        }
    }

    confirmAllAssignments(req, res) {
        try {
            const { criteria } = req.body;
            const assignments = AssignmentService.getPendingAssignments();
            const results = assignments.map((assignment) => {
                try {
                    return AssignmentService.confirmAssignment(assignment.assignmentId, assignment.lineManagerId, criteria);
                }
                catch (error) {
                    return {
                        assignmentId: assignment.assignmentId,
                        employeeName: assignment.employeeName,
                        lineManagerName: assignment.lineManagerName,
                        error: error.message
                    };
                }
            });
            const failed = results.filter((result) => result.error);
            return responseHandler.success(res, { results, failed }, "Pending assignments processed");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    rejectAllAssignments(req, res) {
        try {
            const assignments = AssignmentService.getPendingAssignments();
            const results = assignments.map((assignment) => AssignmentService.rejectAssignment(assignment.assignmentId));
            return responseHandler.success(res, { rejectedCount: results.length }, "Pending assignments rejected");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    getAssignments(req, res) {
        try {
            const assignments = AssignmentService.getAllAssignments();
            return responseHandler.success(
                res,
                assignments,
                "Assignments fetched successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                "Failed to get assignments",
                500
            );
        }
    }

    getPendingAssignments(req, res) {
        try {
            const assignments = AssignmentService.getPendingAssignments();
            return responseHandler.success(
                res,
                assignments,
                "Pending assignments fetched successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                "Failed to get pending assignments",
                500
            );
        }
    }

    getEmployeeAssignment(req, res) {
        try {
            const { employeeId } = req.params;
            const assignment = AssignmentService.getEmployeeAssignment(Number(employeeId));
            return responseHandler.success(
                res,
                assignment || null,
                "Employee assignment fetched successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(
                res,
                "Failed to get employee assignment",
                500
            );
        }
    }
}


export default new AssignmentController();