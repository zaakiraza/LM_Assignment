import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import AssignmentService from "../services/assignmentService";
import ViewLMModal from "./ViewLMModal";
import EditEmployeeModal from "./EditEmployeeModal";

function EmployeeList({ onRequestRefresh, refreshKey, criteria }) {
    const [employees, setEmployees] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [pendingRequests, setPendingRequests] = useState({});
    const [loading, setLoading] = useState(true);
    const [viewEmployee, setViewEmployee] = useState(null);
    const [error, setError] = useState("");
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [assigneeView, setAssigneeView] = useState(null);
    const [openActionMenu, setOpenActionMenu] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [selectedDesignation, setSelectedDesignation] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const employeesPerPage = 10;

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

            const pending = await AssignmentService.getPendingAssignments();
            setPendingRequests(Object.fromEntries(pending.map((request) => [request.assignedEmpId, request])));
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
    }, [refreshKey]);

    const departments = [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort();
    const designations = [...new Set(employees.map((employee) => employee.designation).filter(Boolean))].sort();
    const filteredEmployees = employees.filter((employee) => (
        (selectedDepartment === "all" || employee.department === selectedDepartment) &&
        (selectedDesignation === "all" || employee.designation === selectedDesignation)
    ));
    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeesPerPage));
    const pageStart = (currentPage - 1) * employeesPerPage;
    const visibleEmployees = filteredEmployees.slice(pageStart, pageStart + employeesPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDepartment, selectedDesignation]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleSeeAssignees = async (employee) => {
        const isLineManager = criteria.allowedDesignations.includes(employee.designation);
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

    const handleRequestLM = async (employee) => {
        try {
            await AssignmentService.createAssignment(employee.id, null, criteria);
            await fetchData();
            onRequestRefresh?.();
        }
        catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to create LM request");
        }
    };

    const handleUndoRequest = async (employee) => {
        const request = pendingRequests[employee.id];
        if (!request) return;
        if (!window.confirm(`Undo the LM request for ${employee.name}?`)) return;

        try {
            await AssignmentService.cancelPendingAssignment(request.assignmentId);
            await fetchData();
            onRequestRefresh?.();
        }
        catch (cancelError) {
            setError(cancelError.response?.data?.message || "Failed to undo LM request");
        }
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
                    <select
                        className="department-filter"
                        value={selectedDepartment}
                        onChange={(event) => {
                            setSelectedDepartment(event.target.value);
                            setCurrentPage(1);
                        }}
                        aria-label="Filter employees by department"
                    >
                        <option value="all">All departments</option>
                        {departments.map((department) => (
                            <option key={department} value={department}>{department}</option>
                        ))}
                    </select>
                    <select
                        className="department-filter"
                        value={selectedDesignation}
                        onChange={(event) => {
                            setSelectedDesignation(event.target.value);
                            setCurrentPage(1);
                        }}
                        aria-label="Filter employees by designation"
                    >
                        <option value="all">All designations</option>
                        {designations.map((designation) => (
                            <option key={designation} value={designation}>{designation}</option>
                        ))}
                    </select>
                </div>
                <span className="counter-pill">
                    {filteredEmployees.length === employees.length
                        ? `${employees.length} total`
                        : `${filteredEmployees.length} / ${employees.length} total`}
                </span>
            </div>

            <div className="employee-list">
                {visibleEmployees.map((employee) => {
                    const assignment = assignments[employee.id];
                    const pendingRequest = pendingRequests[employee.id];
                    const isLineManager = criteria.allowedDesignations.includes(employee.designation);

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
                                <span className={`status-badge ${assignment ? "assigned" : pendingRequest ? "pending" : "open"}`}>
                                    {assignment ? "Assigned" : pendingRequest ? "Requested" : "Open"}
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
                                <div className="employee-action-menu">
                                    <button
                                        type="button"
                                        className="menu-btn"
                                        aria-label={`Open actions for ${employee.name}`}
                                        aria-expanded={openActionMenu === employee.id}
                                        onClick={() => setOpenActionMenu((current) => current === employee.id ? null : employee.id)}
                                    >
                                        <span aria-hidden="true">⋮</span>
                                    </button>

                                    {openActionMenu === employee.id && (
                                        <div className="action-menu" role="menu">
                                            {assignment ? (
                                                <button type="button" className="action-menu-item" onClick={() => { setViewEmployee(employee); setOpenActionMenu(null); }}>
                                                    View LM
                                                </button>
                                            ) : pendingRequest ? (
                                                <button type="button" className="action-menu-item action-menu-danger" onClick={() => { handleUndoRequest(employee); setOpenActionMenu(null); }}>
                                                    Undo request
                                                </button>
                                            ) : (
                                                <button type="button" className="action-menu-item action-menu-primary" onClick={() => { handleRequestLM(employee); setOpenActionMenu(null); }}>
                                                    Request LM
                                                </button>
                                            )}
                                            <button type="button" className="action-menu-item" onClick={() => { handleEditEmployee(employee); setOpenActionMenu(null); }}>
                                                Edit
                                            </button>
                                            <button type="button" className="action-menu-item action-menu-danger" onClick={() => { handleDeleteEmployee(employee); setOpenActionMenu(null); }}>
                                                Delete
                                            </button>
                                            {isLineManager && (
                                                <button type="button" className="action-menu-item" onClick={() => { handleSeeAssignees(employee); setOpenActionMenu(null); }}>
                                                    See Assignees
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {filteredEmployees.length > employeesPerPage && (
                <div className="pagination-controls" aria-label="Employee pagination">
                    <button
                        type="button"
                        className="secondary-btn small-btn"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        type="button"
                        className="secondary-btn small-btn"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            {filteredEmployees.length === 0 && (
                <div className="empty-state employee-filter-empty">
                    <p>No employees found in this department.</p>
                </div>
            )}

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

            {viewEmployee && (
                <ViewLMModal
                    employee={viewEmployee}
                    assignment={assignments[viewEmployee.id]}
                    criteria={criteria}
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