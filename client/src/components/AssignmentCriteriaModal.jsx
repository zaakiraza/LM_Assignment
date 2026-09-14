import { useState } from "react";

const availableDesignations = [
    "Software Architect",
    "Lead Software Engineer"
];

function AssignmentCriteriaModal({ criteria, onClose, onSave }) {
    const [draft, setDraft] = useState({
        ...criteria,
        allowedDesignations: [...criteria.allowedDesignations]
    });

    const toggleDesignation = (designation) => {
        setDraft((current) => {
            const isSelected = current.allowedDesignations.includes(designation);
            return {
                ...current,
                allowedDesignations: isSelected
                    ? current.allowedDesignations.filter((item) => item !== designation)
                    : [...current.allowedDesignations, designation]
            };
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (draft.allowedDesignations.length === 0 || draft.maxManagedEmployees < 1) return;
        onSave({
            ...draft,
            maxManagedEmployees: Number(draft.maxManagedEmployees)
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal modal-compact">
                <div className="modal-head">
                    <div>
                        <p className="eyebrow">Workspace rules</p>
                        <h2>Assignment criteria</h2>
                    </div>
                    <button type="button" className="icon-close" onClick={onClose}>×</button>
                </div>

                <form className="modal-form criteria-form" onSubmit={handleSubmit}>
                    <label className="field-label" htmlFor="max-managed-employees">
                        Maximum employees per LM
                    </label>
                    <input
                        id="max-managed-employees"
                        type="number"
                        min="1"
                        value={draft.maxManagedEmployees}
                        onChange={(event) => setDraft({ ...draft, maxManagedEmployees: event.target.value })}
                    />

                    <span className="field-label">Eligible LM designations</span>
                    <div className="criteria-options">
                        {availableDesignations.map((designation) => (
                            <label key={designation} className="criteria-option">
                                <input
                                    type="checkbox"
                                    checked={draft.allowedDesignations.includes(designation)}
                                    onChange={() => toggleDesignation(designation)}
                                />
                                <span>{designation}</span>
                            </label>
                        ))}
                    </div>

                    <label className="criteria-option">
                        <input
                            type="checkbox"
                            checked={draft.requireSameDepartment}
                            onChange={(event) => setDraft({ ...draft, requireSameDepartment: event.target.checked })}
                        />
                        <span>Require the same department</span>
                    </label>

                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={!draft.allowedDesignations.length || draft.maxManagedEmployees < 1}>
                            Apply criteria
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AssignmentCriteriaModal;