import AssignmentService from "../services/assignmentService.js";
import EmployeeService from "../services/employeeService.js";
import AiRecommendationService from "../services/aiRecommendationService.js";
import responseHandler from "../utils/responseHandler.js";
import { isHR } from "../constants/positions.js";

class AssignmentController {
    async createAssignment(req, res) {
        try {
            const { employeeId, lineManagerId, criteria } = req.body;
            if (!employeeId) {
                return responseHandler.error(res, "employeeId is required", 400);
            }

            const position = req.employee.position;
            const selfId = String(req.employee._id);
            if (!isHR(position) && String(employeeId) !== selfId) {
                return responseHandler.error(res, "You can only create a request for yourself", 403);
            }

            const assignment = await AssignmentService.createAssignment(employeeId, lineManagerId, criteria);
            return responseHandler.success(res, assignment, "LM assignment request created successfully", 201);
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message || "Failed to create assignment request", 400);
        }
    }

    async confirmAssignment(req, res) {
        try {
            const { lineManagerId, criteria } = req.body;
            const assignment = await AssignmentService.confirmAssignment(
                req.params.assignmentId,
                lineManagerId,
                criteria
            );
            return responseHandler.success(res, assignment, "Line Manager assigned successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    async rejectAssignment(req, res) {
        try {
            const rejectedAssignment = await AssignmentService.rejectAssignment(req.params.assignmentId);
            return responseHandler.success(res, rejectedAssignment, "Assignment rejected successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    async cancelPendingAssignment(req, res) {
        try {
            const pending = (await AssignmentService.getPendingAssignments())
                .find((item) => item.assignmentId === String(req.params.assignmentId));
            if (!pending) {
                return responseHandler.error(res, "Pending assignment request not found", 404);
            }

            const position = req.employee.position;
            const selfId = String(req.employee._id);
            if (!isHR(position) && pending.assignedEmpId !== selfId) {
                return responseHandler.error(res, "You can only cancel your own pending request", 403);
            }

            const cancelledAssignment = await AssignmentService.cancelPendingAssignment(req.params.assignmentId);
            return responseHandler.success(res, cancelledAssignment, "LM request cancelled successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    async confirmAllAssignments(req, res) {
        try {
            const { criteria } = req.body;
            const assignments = await AssignmentService.getPendingAssignments();
            const results = [];

            for (const assignment of assignments) {
                try {
                    let lineManagerId = assignment.lineManagerId;

                    if (!lineManagerId) {
                        const employee = await EmployeeService.getEmployeeById(assignment.assignedEmpId);
                        const candidates = await EmployeeService.getAvailableLMs(assignment.assignedEmpId, criteria || {});

                        if (criteria?.recommendationMode === "ai") {
                            const recommendation = await AiRecommendationService.recommendLineManager(employee, candidates, criteria);
                            lineManagerId = recommendation.id;
                        }
                        else {
                            lineManagerId = candidates[0]?.id;
                        }
                    }

                    results.push(await AssignmentService.confirmAssignment(assignment.assignmentId, lineManagerId, criteria));
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

    async rejectAllAssignments(req, res) {
        try {
            const assignments = await AssignmentService.getPendingAssignments();
            const results = [];
            for (const assignment of assignments) {
                results.push(await AssignmentService.rejectAssignment(assignment.assignmentId));
            }
            return responseHandler.success(res, { rejectedCount: results.length }, "Pending assignments rejected");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, error.message, 400);
        }
    }

    async getAssignments(req, res) {
        try {
            const assignments = await AssignmentService.getAllAssignments();
            return responseHandler.success(res, assignments, "Assignments fetched successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, "Failed to get assignments", 500);
        }
    }

    async getPendingAssignments(req, res) {
        try {
            const assignments = await AssignmentService.getPendingAssignments();
            return responseHandler.success(res, assignments, "Pending assignments fetched successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, "Failed to get pending assignments", 500);
        }
    }

    async getEmployeeAssignment(req, res) {
        try {
            // Any verified employee can view assignment status on the roster (read-only).
            const assignment = await AssignmentService.getEmployeeAssignment(req.params.employeeId);
            return responseHandler.success(res, assignment || null, "Employee assignment fetched successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, "Failed to get employee assignment", 500);
        }
    }

    async getMyPendingAssignment(req, res) {
        try {
            const employeeId = req.employee._id;
            const assignment = await AssignmentService.getPendingAssignmentForEmployee(employeeId);
            return responseHandler.success(res, assignment || null, "Pending assignment fetched successfully");
        }
        catch (error) {
            console.error(error);
            return responseHandler.error(res, "Failed to get pending assignment", 500);
        }
    }
}

export default new AssignmentController();
