import { useEffect, useState } from "react";
import AssignmentService from "../services/assignmentService";
import AssignmentModal from "./AssignmentModal";
import LoadingSpinner from "./LoadingSpinner";

function PendingAssignments({ refreshKey, criteria, compact, onRequestRefresh }) {
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showRequests, setShowRequests] = useState(!compact);
    const [processing, setProcessing] = useState(false);
    const [bulkFailures, setBulkFailures] = useState([]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await AssignmentService.getPendingAssignments();
            setAssignments(data);
        }
        catch (loadError) {
            console.error(loadError);
            setError("Failed to load pending assignments");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [refreshKey]);

    const handleReject = async (assignmentId) => {
        if (!window.confirm("Reject this LM request?")) return;
        try {
            await AssignmentService.rejectAssignment(assignmentId);
            await fetchAssignments();
            onRequestRefresh?.();
        }
        catch (rejectError) {
            console.error(rejectError);
            setError(rejectError.response?.data?.message || "Failed to reject assignment request");
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
        return <LoadingSpinner label="Loading requests..." />;
    }

    return (
        <div className={`pending-section${compact ? " compact-request" : ""}`}>
            {compact && (
                <button type="button" className="primary-btn full" onClick={() => setShowRequests(true)}>
                    View requests ({assignments.length})
                </button>
            )}

            {showRequests && (
                <div className={compact ? "modal-overlay" : "request-page-surface"}>
                    <div className={compact ? "modal request-modal" : "request-page-table"}>
                        <div className="modal-head requests-head">
                            <div>
                                <p className="eyebrow">Requests</p>
                                <h2>Pending LM assignments</h2>
                            </div>
                            <div className="requests-head-actions">
                                {assignments.length > 0 && (
                                    <span className="counter-pill">{assignments.length} pending</span>
                                )}
                                {compact && (
                                    <button type="button" className="icon-close" onClick={() => setShowRequests(false)}>
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        {error && <p className="modal-message error">{error}</p>}

                        {assignments.length === 0 ? (
                            <div className="empty-state requests-empty">
                                <div className="empty-illustration" aria-hidden="true">✓</div>
                                <h3>All caught up</h3>
                                <p>There are no pending LM requests right now.</p>
                            </div>
                        ) : (
                            <>
                                <div className="request-table-wrap">
                                    <table className="request-table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Department</th>
                                                <th>Requested LM</th>
                                                <th>Designation</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assignments.map((assignment) => (
                                                <tr key={assignment.assignmentId}>
                                                    <td>{assignment.employeeName}</td>
                                                    <td>{assignment.employeeDepartment}</td>
                                                <td>{assignment.lineManagerName || "Awaiting HR selection"}</td>
                                                <td>{assignment.lineManagerDesignation || (assignment.employeeName ? "Change / new LM request" : "Pending manager selection")}</td>
                                                    <td className="table-actions">
                                                        <button
                                                            className="secondary-btn small-btn"
                                                            disabled={processing}
                                                            onClick={() => handleReject(assignment.assignmentId)}
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            className="primary-btn small-btn"
                                                            disabled={processing}
                                                            onClick={() => setSelectedAssignment(assignment)}
                                                        >
                                                            Assign
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

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
                                    <button
                                        className="secondary-btn danger-btn"
                                        disabled={processing}
                                        onClick={handleRejectAll}
                                    >
                                        Reject All
                                    </button>
                                    <button
                                        className="primary-btn"
                                        disabled={processing}
                                        onClick={handleAssignAll}
                                    >
                                        {processing ? "Working..." : "Assign All"}
                                    </button>
                                </div>
                            </>
                        )}
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
