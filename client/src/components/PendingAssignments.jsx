import { useEffect, useState } from "react";
import AssignmentService from "../services/assignmentService";
import AssignmentModal from "./AssignmentModal";

function PendingAssignments({ refreshKey, criteria, onRequestRefresh }) {
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showRequests, setShowRequests] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [bulkFailures, setBulkFailures] = useState([]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const data = await AssignmentService.getPendingAssignments();
            setAssignments(data);
        } catch (error) {
            console.error(error);
            setError("Failed to load pending assignments");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchAssignments();
    }, [refreshKey]);

    const handleReject = async (assignmentId) => {
        try {
            await AssignmentService.rejectAssignment(assignmentId);
            await fetchAssignments();
            onRequestRefresh?.();
        }
        catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Failed to reject assignment request");
        }
    };

    const handleAssignAll = async () => {
        if (!window.confirm("Assign all pending requests?")) return;
        try {
            setProcessing(true);
            setError("");
            const result = await AssignmentService.confirmAllAssignments(criteria);
            await fetchAssignments();
            onRequestRefresh?.();
            setBulkFailures(result.failed || []);
        }
        catch (processError) {
            setError(processError.response?.data?.message || "Failed to assign all requests");
        }
        finally {
            setProcessing(false);
        }
    };

    const handleRejectAll = async () => {
        if (!window.confirm("Reject all pending requests?")) return;
        try {
            setProcessing(true);
            setError("");
            setBulkFailures([]);
            await AssignmentService.rejectAllAssignments();
            await fetchAssignments();
            onRequestRefresh?.();
        }
        catch (processError) {
            setError(processError.response?.data?.message || "Failed to reject all requests");
        }
        finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="panel-state"><h2>Loading assignments...</h2></div>;
    }

    if (error) {
        return <div className="panel-state error"><h2>{error}</h2></div>;
    }

    return (
        <div className="pending-section">
            <div className="section-header compact">
                <div>
                    <p className="eyebrow">Requests</p>
                    <h2>LM Assignment</h2>
                </div>
                <span className="counter-pill neutral">{assignments.length}</span>
            </div>

            <button type="button" className="primary-btn full" onClick={() => setShowRequests(true)}>
                View requests ({assignments.length})
            </button>

            {showRequests && (
                <div className="modal-overlay">
                    <div className="modal request-modal">
                        <div className="modal-head">
                            <div>
                                <p className="eyebrow">Requests</p>
                                <h2>Pending LM assignments</h2>
                            </div>
                            <button type="button" className="icon-close" onClick={() => setShowRequests(false)}>×</button>
                        </div>

                        {assignments.length === 0 ? (
                            <div className="empty-state"><p>No pending LM requests.</p></div>
                        ) : (
                            <div className="request-table-wrap">
                                <table className="request-table">
                                    <thead>
                                        <tr><th>Employee</th><th>Department</th><th>Requested LM</th><th>Designation</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {assignments.map((assignment) => (
                                            <tr key={assignment.assignmentId}>
                                                <td>{assignment.employeeName}</td>
                                                <td>{assignment.employeeDepartment}</td>
                                                <td>{assignment.lineManagerName}</td>
                                                <td>{assignment.lineManagerDesignation}</td>
                                                <td className="table-actions">
                                                    <button className="secondary-btn small-btn" disabled={processing} onClick={() => handleReject(assignment.assignmentId)}>Reject</button>
                                                    <button className="primary-btn small-btn" disabled={processing} onClick={() => setSelectedAssignment(assignment)}>Assign</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {error && <p className="modal-message error">{error}</p>}
                        {bulkFailures.length > 0 && (
                            <div className="bulk-failures">
                                <strong>Could not assign these requests:</strong>
                                <ul>
                                    {bulkFailures.map((failure) => (
                                        <li key={failure.assignmentId}>
                                            {failure.employeeName} → {failure.lineManagerName}: {failure.error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="modal-actions table-footer-actions">
                            <button className="secondary-btn danger-btn" disabled={!assignments.length || processing} onClick={handleRejectAll}>Reject All</button>
                            <button className="primary-btn" disabled={!assignments.length || processing} onClick={handleAssignAll}>Assign All</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedAssignment && (
                <AssignmentModal
                    assignment={selectedAssignment}
                    criteria={criteria}
                    onClose={() => setSelectedAssignment(null)}
                    onAssigned={() => {
                        fetchAssignments();
                        onRequestRefresh?.();
                        setSelectedAssignment(null);
                    }}
                />
            )}
        </div>
    );
}

export default PendingAssignments;