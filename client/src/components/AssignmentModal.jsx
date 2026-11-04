import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import AssignmentService from "../services/assignmentService";

function AssignmentModal({ assignment, criteria, onClose, onAssigned }) {
    const [lineManagers, setLineManagers] = useState([]);
    const [selectedLM, setSelectedLM] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const isAiMode = criteria.recommendationMode === "ai";
    const selectedManager = lineManagers.find((lm) => String(lm.id) === String(selectedLM));

    useEffect(() => {
        const fetchLMs = async () => {
            try {
                setLoading(true);
                setError("");
                const data = isAiMode
                    ? await EmployeeService.getAiRecommendation(assignment.assignedEmpId, criteria).then((recommendation) => [recommendation])
                    : await EmployeeService.getAvailableLMs(assignment.assignedEmpId, criteria);

                setLineManagers(data);
                if (isAiMode) {
                    setSelectedLM(String(data[0]?.id || ""));
                }
                else {
                    setSelectedLM(assignment.lineManagerId ? String(assignment.lineManagerId) : String(data[0]?.id || ""));
                }
            }
            catch (loadError) {
                console.error(loadError);
                setError(loadError.response?.data?.message || "Failed to load recommended Line Managers");
            }
            finally {
                setLoading(false);
            }
        };

        fetchLMs();
    }, [
        assignment.assignedEmpId,
        assignment.lineManagerId,
        criteria,
        isAiMode
    ]);

    const handleAssign = async () => {
        if (!selectedLM) {
            setError("Please select a Line Manager");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            await AssignmentService.confirmAssignment(
                assignment.assignmentId,
                selectedLM,
                criteria
            );
            onAssigned();
            onClose();
        }
        catch (assignError) {
            console.error(assignError);
            setError(assignError.response?.data?.message || "Failed to assign Line Manager");
        }
        finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal assign-lm-modal">
                <div className="modal-head">
                    <div>
                        <p className="eyebrow">Assignment</p>
                        <h2>Assign Line Manager</h2>
                    </div>
                    <button type="button" className="icon-close" onClick={onClose}>×</button>
                </div>

                <div className="assign-employee-banner">
                    <div>
                        <span className="meta-label">Employee</span>
                        <strong>{assignment.employeeName}</strong>
                    </div>
                    <div>
                        <span className="meta-label">Department</span>
                        <strong>{assignment.employeeDepartment}</strong>
                    </div>
                    <div>
                        <span className="meta-label">Method</span>
                        <strong className={`method-pill ${isAiMode ? "ai" : "criteria"}`}>
                            {isAiMode ? "Gemini AI" : "Criteria"}
                        </strong>
                    </div>
                </div>

                {loading ? (
                    <div className="assign-loading">
                        <p className="modal-state">Finding recommended line managers...</p>
                    </div>
                ) : (
                    <div className="assign-lm-body">
                        <div className="assign-section-head">
                            <p className="field-label">
                                {isAiMode ? "AI recommendation" : "Recommended line managers"}
                            </p>
                            <span className="counter-pill">{lineManagers.length}</span>
                        </div>

                        {lineManagers.length === 0 ? (
                            <p className="modal-message warning">No suitable Line Manager is available for the current criteria.</p>
                        ) : (
                            <div className="lm-choice-list">
                                {lineManagers.map((lm, index) => {
                                    const isSelected = String(selectedLM) === String(lm.id);
                                    const skills = Array.isArray(lm.skills) ? lm.skills.slice(0, 4) : [];
                                    return (
                                        <button
                                            key={lm.id}
                                            type="button"
                                            className={`lm-choice-card${isSelected ? " selected" : ""}`}
                                            onClick={() => setSelectedLM(String(lm.id))}
                                        >
                                            <div className="lm-choice-top">
                                                <div className="lm-avatar">{(lm.name || "?").slice(0, 1)}</div>
                                                <div className="lm-choice-copy">
                                                    <strong>{lm.name}</strong>
                                                    <span>{lm.position}</span>
                                                </div>
                                                {(isAiMode || index === 0) && (
                                                    <span className="lm-rank-pill">
                                                        {isAiMode ? "AI pick" : "Top match"}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="lm-choice-meta">
                                                <span>{lm.experience} yrs</span>
                                                <span>{lm.department}</span>
                                                <span>{lm.employeeManaged ?? 0} managed</span>
                                            </div>

                                            {skills.length > 0 && (
                                                <div className="lm-choice-skills">
                                                    {skills.map((skill) => (
                                                        <span key={`${lm.id}-${skill}`} className="skill-tag compact">{skill}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {lm.recommendationReason && (
                                                <p className="lm-choice-reason">{lm.recommendationReason}</p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {selectedManager && (
                            <div className="assign-selected-summary">
                                <span className="meta-label">Selected</span>
                                <strong>{selectedManager.name}</strong>
                                <span>{selectedManager.position} · {selectedManager.department}</span>
                            </div>
                        )}
                    </div>
                )}

                {error && <p className="modal-message error">{error}</p>}

                <div className="modal-actions">
                    <button type="button" className="secondary-btn" onClick={onClose} disabled={submitting}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="primary-btn"
                        onClick={handleAssign}
                        disabled={!selectedLM || submitting || loading || lineManagers.length === 0}
                    >
                        {submitting ? "Assigning..." : "Confirm assign"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AssignmentModal;
