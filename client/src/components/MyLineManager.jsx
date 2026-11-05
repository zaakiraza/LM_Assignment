function MyLineManager({ assignment, pendingRequest, acting, onRequestChange, onUndoRequest }) {
    if (!assignment) {
        return (
            <div className="empty-state requests-empty">
                <div className="empty-illustration" aria-hidden="true">👤</div>
                <h3>{pendingRequest ? "Line manager being assigned" : "No line manager yet"}</h3>
                <p className="empty-hint">
                    {pendingRequest
                        ? "HR is assigning your line manager. You'll see the details here once it's confirmed."
                        : "Line managers are assigned by HR. Once you have one, you can view their details, meetings and feedback here."}
                </p>
            </div>
        );
    }

    const skills = Array.isArray(assignment.lineManagerSkills)
        ? assignment.lineManagerSkills
        : String(assignment.lineManagerSkills || "").split(",").map((skill) => skill.trim()).filter(Boolean);

    return (
        <div className="feature-page">
            <article className="employee-card lm-profile-card">
                <div className="lm-profile-head">
                    <span className="lm-avatar large">
                        {(assignment.lineManagerName || "?").slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                        <span className="meta-label">Your line manager</span>
                        <h3>{assignment.lineManagerName || "—"}</h3>
                        <p>{assignment.lineManagerDesignation || "—"} · {assignment.lineManagerDepartment || "—"}</p>
                    </div>
                </div>

                <div className="employee-grid">
                    <div>
                        <span className="meta-label">Experience</span>
                        <strong>{assignment.lineManagerExperience ?? 0} yrs</strong>
                    </div>
                    <div>
                        <span className="meta-label">Team size</span>
                        <strong>{assignment.lineManagerEmployeeManaged ?? 0} employees</strong>
                    </div>
                </div>

                <div className="skills-box">
                    <span className="meta-label">Skills</span>
                    {skills.length ? (
                        <div className="skill-tags lm-profile-skills">
                            {skills.map((skill) => <span key={skill} className="skill-tag compact">{skill}</span>)}
                        </div>
                    ) : <p>—</p>}
                </div>
            </article>

            <div className="lm-change-box">
                <div>
                    <h3>Change line manager</h3>
                    <p>
                        {pendingRequest
                            ? "Your change request is pending. HR will choose and assign your new line manager."
                            : "Need a different line manager? Send a request and HR will review it."}
                    </p>
                </div>
                {pendingRequest ? (
                    <button type="button" className="secondary-btn" disabled={acting} onClick={onUndoRequest}>
                        {acting ? "Cancelling..." : "Undo change request"}
                    </button>
                ) : (
                    <button type="button" className="primary-btn" disabled={acting} onClick={onRequestChange}>
                        {acting ? "Requesting..." : "Request change"}
                    </button>
                )}
            </div>
        </div>
    );
}

export default MyLineManager;
