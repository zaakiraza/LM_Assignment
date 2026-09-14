import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import AssignmentService from "../services/assignmentService";

function AssignLMModal({ employee, currentAssignment, criteria, onClose, onAssigned }) {
    const [lineManagers, setLineManagers] = useState([]);
    const [selectedLM, setSelectedLM] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLineManagers = async () => {
            try {
                const data = await EmployeeService.getAvailableLMs(employee.id, criteria);
                const filteredLMs = data.filter((lm) => lm.id !== currentAssignment?.lineManagerId);
                setLineManagers(filteredLMs);
            }
            catch (error) {
                console.error(error);
                setError("Failed to load available Line Managers");
            }
            finally {
                setLoading(false);
            }
        };
        fetchLineManagers();
    }, [employee.id, currentAssignment]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedLM) {
            setError("Please select a Line Manager");
            return;
        }
        try {
            setSubmitting(true);
            setError("");
            await AssignmentService.createAssignment(employee.id, Number(selectedLM), criteria);
            onAssigned();
            onClose();
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Failed to create LM request");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal modal-compact">
                <div className="modal-head">
                    <div>
                        <p className="eyebrow">Assignment</p>
                        <h2>Assign Line Manager</h2>
                    </div>
                    <button type="button" className="icon-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body compact-body">
                    <div className="compact-meta">
                        <span>Employee:</span>
                        <strong>{employee.name}</strong>
                    </div>
                    <div className="compact-meta">
                        <span>Department:</span>
                        <strong>{employee.department}</strong>
                    </div>
                </div>

                {loading ? (
                    <p className="modal-state">Loading recommended LMs...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="modal-form">
                        <label className="field-label">Recommended Line Managers</label>
                        <select value={selectedLM} onChange={(event) => setSelectedLM(event.target.value)}>
                            <option value="">Select LM</option>
                            {lineManagers.map((lm) => (
                                <option key={lm.id} value={lm.id}>
                                    {lm.name} — {lm.designation} — {lm.employeeManaged} managees
                                </option>
                            ))}
                        </select>

                        {lineManagers.length === 0 && <p className="modal-message warning">No suitable Line Manager is available.</p>}

                        {error && <p className="modal-message error">{error}</p>}

                        <div className="modal-actions">
                            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                            <button type="submit" className="primary-btn" disabled={!selectedLM || submitting}>
                                {submitting ? "Submitting..." : "Confirm Assign"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default AssignLMModal;