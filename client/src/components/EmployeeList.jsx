import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import AssignmentService from "../services/assignmentService";
import AssignLMModal from "./AssignLMModal";
import ViewLMModal from "./ViewLMModal";
import AddEmployeeModal from "./AddEmployeeModal";
import EditEmployeeModal from "./EditEmployeeModal";

function EmployeeList({ onRequestRefresh }) {
    const [employees, setEmployees] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewEmployee, setViewEmployee] = useState(null);
    const [error, setError] = useState("");
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [assigneeView, setAssigneeView] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const employeeData = await EmployeeService.getEmployees();
            setEmployees(employeeData);

            const assignmentResults = await Promise.all(employeeData.map(async (employee) => {
                const assignment = await AssignmentService.getEmployeeAssignment(employee.id);
                return { employeeId: employee.id, assignment };
            }));

            const assignmentMap = {};
            assignmentResults.forEach(({ employeeId, assignment }) => {
                assignmentMap[employeeId] = assignment;
            });

            setAssignments(assignmentMap);
        }
        catch (error) {
            console.error(error);
            setError("Failed to load employees");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    const handleSeeAssignees = async (employee) => {
        const isLineManager = ["Software Architect", "Lead Software Engineer"].includes(employee.designation);
        if (!isLineManager) {
            setAssigneeView({
                lineManagerName: employee.name,
                employees: [],
                count: 0,
                restricted: true
            });
            return;
        }

        try {
            const assignedEmployees = await EmployeeService.getLineManagerAssignees(employee.id);
            setAssigneeView({
                lineManagerName: employee.name,
                employees: assignedEmployees,
                count: assignedEmployees.length,
                restricted: false
            });
        }
        catch (loadError) {
            console.error(loadError);
            setError("Failed to load assignee list");
        }
    };

    const handleEditEmployee = (employee) => {
        setEditingEmployee(employee);
    };

    const handleDeleteEmployee = async (employee) => {
        const confirmed = window.confirm(`Delete ${employee.name}? This will remove the employee record.`);
        if (!confirmed) return;
        try {
            await EmployeeService.deleteEmployee(employee.id);
            await fetchData();
            onRequestRefresh?.();
        }
        catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Failed to delete employee");
        }
    };

    if (loading) {
        return <div className="panel-state"><h2>Loading employees...</h2></div>;
    }

    if (error) {
        return <div className="panel-state error"><h2>{error}</h2></div>;
    }

    return (
        <div className="employee-list-section">
            <p className="eyebrow">Team roster</p>

            <div className="section-header">
                <div>
                    <h2>Employees</h2>
                    <button
                        className="primary-btn"
                        onClick={() => setShowAddEmployee(true)}
                    >
                        + Add Employee
                    </button>
                </div>
                <span className="counter-pill">{employees.length} total</span>
            </div>

            {showAddEmployee && (
                <AddEmployeeModal
                    onClose={() => setShowAddEmployee(false)}
                    onAdded={() => fetchData()}
                />
            )}

            <div className="employee-list">
                {employees.map((employee) => {
                    const assignment = assignments[employee.id];
                    const isLineManager = ["Software Architect", "Lead Software Engineer"].includes(employee.designation);

                    let skills = "";
                    if (Array.isArray(employee.skills)) {
                        skills = employee.skills.join(", ");
                    } else if (typeof employee.skills === "string") {
                        try {
                            const parsedSkills = JSON.parse(employee.skills || "[]");
                            skills = Array.isArray(parsedSkills) ? parsedSkills.join(", ") : employee.skills;
                        } catch {
                            skills = employee.skills || "";
                        }
                    }

                    return (
                        <article key={employee.id} className="employee-card">
                            <div className="employee-card-header">
                                <div>
                                    <p className="mini-label">Employee</p>
                                    <h3>{employee.name}</h3>
                                </div>
                                <span className={`status-badge ${assignment ? "assigned" : "open"}`}>
                                    {assignment ? "Assigned" : "Open"}
                                </span>
                            </div>

                            <div className="employee-grid">
                                <div>
                                    <span className="meta-label">Designation</span>
                                    <strong>{employee.designation}</strong>
                                </div>
                                <div>
                                    <span className="meta-label">Experience</span>
                                    <strong>{employee.experience} yrs</strong>
                                </div>
                                <div>
                                    <span className="meta-label">Department</span>
                                    <strong>{employee.department}</strong>
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

                            <div className="employee-card-actions">
                                {assignment ? (
                                    <>
                                        <button className="secondary-btn" onClick={() => setViewEmployee(employee)}>
                                            View LM
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="primary-btn" onClick={() => setSelectedEmployee(employee)}>
                                            Add LM
                                        </button>
                                    </>
                                )}
                                <button className="secondary-btn" onClick={() => handleEditEmployee(employee)}>
                                    Edit
                                </button>
                                <button className="secondary-btn danger-btn" onClick={() => handleDeleteEmployee(employee)}>
                                    Delete
                                </button>
                                {isLineManager && (
                                    <button className="secondary-btn" onClick={() => handleSeeAssignees(employee)}>
                                        See Assignees
                                    </button>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            {editingEmployee && (
                <EditEmployeeModal
                    employee={editingEmployee}
                    onClose={() => setEditingEmployee(null)}
                    onSaved={() => {
                        setEditingEmployee(null);
                        fetchData();
                    }}
                />
            )}

            {assigneeView && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-head">
                            <div>
                                <p className="eyebrow">Manager load</p>
                                <h2>{assigneeView.lineManagerName}</h2>
                            </div>
                            <button type="button" className="icon-close" onClick={() => setAssigneeView(null)}>×</button>
                        </div>

                        <div className="modal-body">
                            {assigneeView.restricted ? (
                                <p className="modal-message warning">See Assignees is only available for line managers.</p>
                            ) : (
                                <>
                                    <div className="detail-row">
                                        <span>Total assignees</span>
                                        <strong>{assigneeView.count}</strong>
                                    </div>

                                    {assigneeView.employees.length > 0 ? (
                                        <div className="assignee-list">
                                            {assigneeView.employees.map((item) => (
                                                <div key={item.id} className="assignee-row">
                                                    <span>{item.name}</span>
                                                    <strong>{item.designation}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="modal-message warning">No employees are assigned to this manager yet.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedEmployee && (
                <AssignLMModal
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                    onAssigned={() => {
                        setSelectedEmployee(null);
                        fetchData();
                        onRequestRefresh?.();
                    }}
                />
            )}

            {viewEmployee && (
                <ViewLMModal
                    employee={viewEmployee}
                    assignment={assignments[viewEmployee.id]}
                    onClose={() => setViewEmployee(null)}
                    onChanged={() => {
                        setViewEmployee(null);
                        fetchData();
                        onRequestRefresh?.();
                    }}
                />
            )}
        </div>
    );
}

export default EmployeeList;