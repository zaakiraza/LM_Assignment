import { useEffect, useState } from "react";
import AssignmentService from "../services/assignmentService";
import AssignmentModal from "./AssignmentModal";

function PendingAssignments({ refreshKey, onRequestRefresh }) {
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

            {assignments.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-illustration">✓</span>
                    <p>No pending LM requests.</p>
                </div>
            ) : (
                <div className="pending-list">
                    {assignments.map((assignment) => (
                        <div key={assignment.assignmentId} className="pending-card">
                            <div className="pending-card-head">
                                <div>
                                    <p className="mini-label">Employee</p>
                                    <h3>{assignment.employeeName}</h3>
                                </div>
                                <span className="status-badge pending">Pending</span>
                            </div>

                            <dl className="detail-list">
                                <div>
                                    <dt>Department</dt>
                                    <dd>{assignment.employeeDepartment}</dd>
                                </div>
                                <div>
                                    <dt>Requested LM</dt>
                                    <dd>{assignment.lineManagerName}</dd>
                                </div>
                                <div>
                                    <dt>Designation</dt>
                                    <dd>{assignment.lineManagerDesignation}</dd>
                                </div>
                            </dl>

                            <div className="pending-card-actions">
                                <button className="secondary-btn small-btn" onClick={() => handleReject(assignment.assignmentId)}>
                                    Reject
                                </button>
                                <button className="primary-btn small-btn" onClick={() => setSelectedAssignment(assignment)}>
                                    Assign
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedAssignment && (
                <AssignmentModal
                    assignment={selectedAssignment}
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