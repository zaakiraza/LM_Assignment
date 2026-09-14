import AssignmentService from "../services/assignmentService.js";
import EmployeeService from "../services/employeeService.js";
import AiRecommendationService from "../services/aiRecommendationService.js";
import responseHandler from "../utils/responseHandler.js";

class AssignmentController {

    createAssignment(req, res) {
        try {
            const { employeeId, lineManagerId, criteria } = req.body;
            if (!employeeId) {
                return responseHandler.error(
                    res,
                    "employeeId is required",
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

    cancelPendingAssignment(req, res) {
        try {
            const assignmentId = Number(req.params.assignmentId);
            const cancelledAssignment = AssignmentService.cancelPendingAssignment(assignmentId);

            return responseHandler.success(
                res,
                cancelledAssignment,
                "LM request cancelled successfully"
            );
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    async confirmAllAssignments(req, res) {
        try {
            const { criteria } = req.body;
            const assignments = AssignmentService.getPendingAssignments();
            const results = [];

            for (const assignment of assignments) {
                try {
                    let lineManagerId = assignment.lineManagerId;

                    if (!lineManagerId) {
                        const employee = EmployeeService.getEmployeeById(assignment.assignedEmpId);
                        const candidates = EmployeeService.getAvailableLMs(assignment.assignedEmpId, criteria || {});

                        if (criteria?.recommendationMode === "ai") {
                            const recommendation = await AiRecommendationService.recommendLineManager(employee, candidates, criteria);
                            lineManagerId = recommendation.id;
                        }
                        else {
                            lineManagerId = candidates[0]?.id;
                        }
                    }

                    results.push(AssignmentService.confirmAssignment(assignment.assignmentId, lineManagerId, criteria));
                }
                catch (error) {
                    results.push({
                        assignmentId: assignment.assignmentId,
                        employeeName: assignment.employeeName,
                        lineManagerName: assignment.lineManagerName,
                        error: error.message
                    });
                }
            }
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