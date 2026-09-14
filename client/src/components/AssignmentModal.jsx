import { useEffect, useState } from "react";

import EmployeeService
    from "../services/employeeService";

import AssignmentService
    from "../services/assignmentService";


function AssignmentModal({
    assignment,
    criteria,
    onClose,
    onAssigned
}) {

    const [lineManagers, setLineManagers] =
        useState([]);

    const [selectedLM, setSelectedLM] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");


    useEffect(() => {

        const fetchLMs = async () => {

            try {

                const data =
                    await EmployeeService
                        .getAvailableLMs(
                            assignment.assignedEmpId,
                            criteria
                        );

                setLineManagers(data);


                /*
                 * Pre-select the originally
                 * requested LM.
                 */
                setSelectedLM(
                    String(
                        assignment.lineManagerId
                    )
                );

            }
            catch (error) {

                console.error(error);

                setError(
                    "Failed to load recommended Line Managers"
                );

            }
            finally {

                setLoading(false);
            }
        };


        fetchLMs();

    }, [
        assignment.assignedEmpId,
        assignment.lineManagerId
    ]);


    const handleAssign = async () => {

        if (!selectedLM) {

            setError(
                "Please select a Line Manager"
            );

            return;
        }


        try {

            setSubmitting(true);
            setError("");


            await AssignmentService
                .confirmAssignment(
                    assignment.assignmentId,
                    Number(selectedLM),
                    criteria
                );


            onAssigned();
            onClose();

        }
        catch (error) {

            console.error(error);

            setError(
                error.response?.data?.message ||
                "Failed to assign Line Manager"
            );

        }
        finally {

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
                        <strong>{assignment.employeeName}</strong>
                    </div>
                    <div className="compact-meta">
                        <span>Department:</span>
                        <strong>{assignment.employeeDepartment}</strong>
                    </div>
                </div>

                {loading ? (
                    <p className="modal-state">Loading recommended LMs...</p>
                ) : (
                    <>
                        <label className="field-label">Recommended Line Managers</label>
                        <select value={selectedLM} onChange={(event) => setSelectedLM(event.target.value)}>
                            <option value="">Select Line Manager</option>
                            {lineManagers.map((lm) => (
                                <option key={lm.id} value={lm.id}>
                                    {lm.name} — {lm.designation} — {lm.employeeManaged} managees
                                </option>
                            ))}
                        </select>

                        {lineManagers.length === 0 && (
                            <p className="modal-message warning">No suitable Line Manager is available.</p>
                        )}
                    </>
                )}

                {error && <p className="modal-message error">{error}</p>}

                <div className="modal-actions">
                    <button type="button" className="secondary-btn" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button type="button" className="primary-btn" onClick={handleAssign} disabled={!selectedLM || submitting || loading}>
                        {submitting ? "Assigning..." : "Confirm Assign"}
                    </button>
                </div>
            </div>
        </div>
    );
}


export default AssignmentModal;