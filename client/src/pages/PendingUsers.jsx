import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import { POSITIONS } from "../config/positions";

const emptyForm = {
    name: "",
    position: "",
    experience: "",
    department: "",
    skills: []
};

function PendingUsers() {
    const [pending, setPending] = useState([]);
    const [forms, setForms] = useState({});
    const [skillDrafts, setSkillDrafts] = useState({});
    const [openId, setOpenId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const employees = await EmployeeService.getUnverifiedEmployees();
            setPending(employees);
            setForms(Object.fromEntries(employees.map((employee) => [
                employee.id,
                {
                    name: employee.name || "",
                    position: employee.position || "",
                    experience: employee.experience ?? "",
                    department: employee.department === "Unassigned" ? "" : (employee.department || ""),
                    skills: Array.isArray(employee.skills) ? [...employee.skills] : []
                }
            ])));
            setSkillDrafts({});
            setOpenId(null);
        }
        catch (loadError) {
            setError(loadError.response?.data?.message || "Failed to load unverified employees");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const updateForm = (id, field, value) => {
        setForms((current) => ({
            ...current,
            [id]: { ...(current[id] || emptyForm), [field]: value }
        }));
    };

    const addSkill = (employeeId) => {
        const draft = (skillDrafts[employeeId] || "").trim();
        if (!draft) return;

        setForms((current) => {
            const form = current[employeeId] || emptyForm;
            const skills = Array.isArray(form.skills) ? form.skills : [];
            if (skills.some((skill) => skill.toLowerCase() === draft.toLowerCase())) {
                return current;
            }
            return {
                ...current,
                [employeeId]: {
                    ...form,
                    skills: [...skills, draft]
                }
            };
        });
        setSkillDrafts((current) => ({ ...current, [employeeId]: "" }));
    };

    const removeSkill = (employeeId, skillToRemove) => {
        setForms((current) => {
            const form = current[employeeId] || emptyForm;
            return {
                ...current,
                [employeeId]: {
                    ...form,
                    skills: (form.skills || []).filter((skill) => skill !== skillToRemove)
                }
            };
        });
    };

    const handleVerify = async (employeeId) => {
        const form = forms[employeeId] || emptyForm;
        try {
            setSavingId(employeeId);
            setError("");
            setMessage("");
            await EmployeeService.verifyEmployee(employeeId, {
                name: form.name.trim(),
                position: form.position,
                experience: Number(form.experience),
                department: form.department.trim(),
                skills: Array.isArray(form.skills) ? form.skills : []
            });
            setMessage("Employee verified successfully");
            await load();
        }
        catch (verifyError) {
            setError(verifyError.response?.data?.message || "Failed to verify employee");
        }
        finally {
            setSavingId(null);
        }
    };

    if (loading) return <div className="panel-state"><h2>Loading unverified employees...</h2></div>;

    return (
        <section className="panel panel-main">
            <p className="eyebrow">Access control</p>
            <div className="section-header">
                <div>
                    <h2>Unverified employees</h2>
                    <p>Complete profile details and verify Google sign-ins before they can use the app.</p>
                </div>
                <span className="counter-pill">{pending.length}</span>
            </div>

            {error && <p className="modal-message error">{error}</p>}
            {message && <p className="modal-message">{message}</p>}

            {pending.length === 0 ? (
                <div className="empty-state"><p>No unverified employees.</p></div>
            ) : (
                <div className="verify-accordion" role="list">
                    {pending.map((employee) => {
                        const form = forms[employee.id] || emptyForm;
                        const isOpen = openId === employee.id;
                        const skills = Array.isArray(form.skills) ? form.skills : [];

                        return (
                            <article key={employee.id} className={`verify-accordion-item${isOpen ? " open" : ""}`} role="listitem">
                                <button
                                    type="button"
                                    className="verify-accordion-trigger"
                                    aria-expanded={isOpen}
                                    onClick={() => setOpenId((current) => current === employee.id ? null : employee.id)}
                                >
                                    <div className="verify-accordion-summary">
                                        <div>
                                            <p className="mini-label">Google account</p>
                                            <h3>{employee.email}</h3>
                                            <p className="verify-accordion-name">{form.name || employee.name || "Unnamed"}</p>
                                        </div>
                                        <span className="status-badge pending">Unverified</span>
                                    </div>
                                    <span className="verify-accordion-chevron" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
                                </button>

                                {isOpen && (
                                    <div className="verify-accordion-panel">
                                        <div className="modal-form verify-form">
                                            <label className="field-label">Name</label>
                                            <input
                                                className="modal-input"
                                                value={form.name}
                                                onChange={(event) => updateForm(employee.id, "name", event.target.value)}
                                            />

                                            <label className="field-label">Position</label>
                                            <select
                                                className="modal-input"
                                                value={form.position}
                                                onChange={(event) => updateForm(employee.id, "position", event.target.value)}
                                            >
                                                <option value="">Select position</option>
                                                {POSITIONS.map((position) => (
                                                    <option key={position} value={position}>{position}</option>
                                                ))}
                                            </select>

                                            <label className="field-label">Experience (years)</label>
                                            <input
                                                className="modal-input"
                                                type="number"
                                                min="0"
                                                value={form.experience}
                                                onChange={(event) => updateForm(employee.id, "experience", event.target.value)}
                                            />

                                            <label className="field-label">Department</label>
                                            <select
                                                className="modal-input"
                                                value={form.department}
                                                onChange={(event) => updateForm(employee.id, "department", event.target.value)}
                                            >
                                                <option value="">Select department</option>
                                                <option value="netSuite">netSuite</option>
                                                <option value="App dev">App dev</option>
                                                <option value="IT">IT</option>
                                                <option value="HR">HR</option>
                                            </select>

                                            <label className="field-label">Skills</label>
                                            {skills.length > 0 && (
                                                <div className="skill-tags">
                                                    {skills.map((skill) => (
                                                        <span key={skill} className="skill-tag">
                                                            {skill}
                                                            <button
                                                                type="button"
                                                                className="skill-tag-remove"
                                                                aria-label={`Remove ${skill}`}
                                                                onClick={() => removeSkill(employee.id, skill)}
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <input
                                                className="modal-input"
                                                value={skillDrafts[employee.id] || ""}
                                                onChange={(event) => setSkillDrafts((current) => ({
                                                    ...current,
                                                    [employee.id]: event.target.value
                                                }))}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") {
                                                        event.preventDefault();
                                                        addSkill(employee.id);
                                                    }
                                                }}
                                                placeholder="Type a skill and press Enter"
                                            />

                                            <div className="modal-actions">
                                                <button
                                                    type="button"
                                                    className="primary-btn"
                                                    disabled={savingId === employee.id}
                                                    onClick={() => handleVerify(employee.id)}
                                                >
                                                    {savingId === employee.id ? "Verifying..." : "Verify employee"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default PendingUsers;
