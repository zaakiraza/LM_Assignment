import { useEffect, useState } from "react";

const availableDesignations = [
    "Software Architect",
    "Lead Software Engineer"
];

function AssignmentCriteriaModal({ criteria, onClose, onSave, inline = false }) {
    const [draft, setDraft] = useState({
        ...criteria,
        allowedDesignations: [...criteria.allowedDesignations]
    });
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        setDraft({
            ...criteria,
            allowedDesignations: [...criteria.allowedDesignations]
        });
    }, [criteria]);

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
        const nextCriteria = {
            ...draft,
            maxManagedEmployees: Number(draft.maxManagedEmployees)
        };
        onSave(nextCriteria);
        setDraft(nextCriteria);
        setFeedback("Criteria applied successfully. New recommendations will use these settings.");
    };

    const handleCancel = () => {
        setDraft({
            ...criteria,
            allowedDesignations: [...criteria.allowedDesignations]
        });
        setFeedback("Changes discarded. The saved criteria were restored.");
        if (!inline) onClose();
    };

    return (
        <div className={inline ? "inline-settings" : "modal-overlay"}>
            <div className={inline ? "settings-form-panel" : "modal modal-compact"}>
                <div className="modal-head">
                    <div>
                        <p className="eyebrow">Workspace rules</p>
                        <h2>Assignment criteria</h2>
                    </div>
                    {!inline && <button type="button" className="icon-close" onClick={onClose}>×</button>}
                </div>

                <form className="modal-form criteria-form" onSubmit={handleSubmit}>
                    <label className="field-label" htmlFor="recommendation-mode">
                        Recommendation method
                    </label>
                    <select
                        id="recommendation-mode"
                        value={draft.recommendationMode || "criteria"}
                        onChange={(event) => setDraft({ ...draft, recommendationMode: event.target.value })}
                    >
                        <option value="criteria">Use assignment criteria</option>
                        <option value="ai">Use Gemini AI recommendation</option>
                    </select>

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

                    {feedback && <p className="criteria-feedback" role="status">{feedback}</p>}

                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={handleCancel}>Cancel</button>
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