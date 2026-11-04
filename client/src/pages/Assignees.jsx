import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

function getSkillsText(employee) {
    if (Array.isArray(employee.skills)) return employee.skills.join(", ");
    if (typeof employee.skills === "string") return employee.skills;
    return "";
}

function Assignees() {
    const auth = useAuth();
    const [assignees, setAssignees] = useState([]);
    const [openId, setOpenId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await EmployeeService.getMyAssignees();
                setAssignees(data);
            }
            catch (loadError) {
                setError(loadError.response?.data?.message || "Failed to load assignees");
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingSpinner label="Loading assignees..." />;
    if (error) return <div className="panel-state error"><h2>{error}</h2></div>;

    return (
        <section className="panel panel-main">
            <p className="eyebrow">Line manager</p>
            <div className="section-header">
                <div className="section-heading-block">
                    <h2>My assignees</h2>
                    <p className="page-description">{auth.position}</p>
                </div>
                <span className="counter-pill">{assignees.length}</span>
            </div>

            {assignees.length === 0 ? (
                <div className="empty-state">
                    <p>No employees are assigned to you yet.</p>
                </div>
            ) : (
                <div className="verify-accordion page-assignee-list" role="list">
                    {assignees.map((employee) => {
                        const isOpen = openId === employee.id;
                        const skills = getSkillsText(employee);

                        return (
                            <article
                                key={employee.id}
                                className={`verify-accordion-item${isOpen ? " open" : ""}`}
                                role="listitem"
                            >
                                <button
                                    type="button"
                                    className="verify-accordion-trigger"
                                    aria-expanded={isOpen}
                                    onClick={() => setOpenId((current) => current === employee.id ? null : employee.id)}
                                >
                                    <div className="verify-accordion-summary">
                                        <div>
                                            <h3 className="verify-accordion-name">{employee.name}</h3>
                                            <p>{employee.department || "—"} · {employee.position || "—"}</p>
                                        </div>
                                    </div>
                                    <span className="verify-accordion-chevron" aria-hidden="true">
                                        {isOpen ? "▾" : "▸"}
                                    </span>
                                </button>

                                {isOpen && (
                                    <div className="verify-accordion-panel">
                                        <div className="employee-grid">
                                            <div>
                                                <span className="meta-label">Name</span>
                                                <strong>{employee.name}</strong>
                                            </div>
                                            <div>
                                                <span className="meta-label">Email</span>
                                                <strong>{employee.email || "—"}</strong>
                                            </div>
                                            <div>
                                                <span className="meta-label">Position</span>
                                                <strong>{employee.position || "—"}</strong>
                                            </div>
                                            <div>
                                                <span className="meta-label">Experience</span>
                                                <strong>{employee.experience ?? 0} yrs</strong>
                                            </div>
                                            <div>
                                                <span className="meta-label">Department</span>
                                                <strong>{employee.department || "—"}</strong>
                                            </div>
                                            <div>
                                                <span className="meta-label">Managed</span>
                                                <strong>{employee.employeeManaged ?? 0}</strong>
                                            </div>
                                        </div>
                                        <div className="skills-box">
                                            <span className="meta-label">Skills</span>
                                            <p>{skills || "—"}</p>
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

export default Assignees;
