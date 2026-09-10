import { useState } from "react";

import AssignLMModal from "./AssignLMModal";

function ViewLMModal({ employee, assignment, onClose, onChanged }) {
    const [changeLM, setChangeLM] = useState(false);

    if (changeLM) {
        return (
            <AssignLMModal
                employee={employee}
                currentAssignment={assignment}
                onClose={() => setChangeLM(false)}
                onAssigned={() => {
                    setChangeLM(false);
                    onChanged();
                }}
            />
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-head">
                    <div>
                        <p className="eyebrow">Current assignment</p>
                        <h2>Line Manager</h2>
                    </div>
                    <button type="button" className="icon-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {/* <div className="detail-row">
                        <span>Employee</span>
                        <strong>{employee.name}</strong>
                    </div> */}
                    <div className="detail-row">
                        <span>Name</span>
                        <strong>{assignment.lineManagerName}</strong>
                    </div>
                    <div className="detail-row">
                        <span>Designation</span>
                        <strong>{assignment.lineManagerDesignation}</strong>
                    </div>
                    <div className="detail-row">
                        <span>Experience</span>
                        <strong>{assignment.lineManagerExperience} yrs</strong>
                    </div>
                    <div className="detail-row">
                        <span>Department</span>
                        <strong>{assignment.lineManagerDepartment}</strong>
                    </div>
                    <div className="detail-row">
                        <span>Managed</span>
                        <strong>{assignment.lineManagerEmployeeManaged}</strong>
                    </div>
                </div>

                <div className="modal-actions">
                    <button type="button" className="secondary-btn" onClick={onClose}>Close</button>
                    <button type="button" className="primary-btn" onClick={() => setChangeLM(true)}>Change LM</button>
                </div>
            </div>
        </div>
    );
}

export default ViewLMModal;