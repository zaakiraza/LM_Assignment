import { useEffect, useRef, useState } from "react";
import EmployeeService from "../services/employeeService";
import AssignmentService from "../services/assignmentService";
import ViewLMModal from "./ViewLMModal";
import EditEmployeeModal from "./EditEmployeeModal";
import { useAuth } from "../context/AuthContext";

function getSkillsText(employee) {
    if (Array.isArray(employee.skills)) {
        return employee.skills.join(", ");
    }
    if (typeof employee.skills === "string") {
        try {
            const parsedSkills = JSON.parse(employee.skills || "[]");
            return Array.isArray(parsedSkills) ? parsedSkills.join(", ") : employee.skills;
        }
        catch {
            return employee.skills || "";
        }
    }
    return "";
}

function FilterIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                d="M4 7h16M7 12h10M10 17h4"
            />
            <circle cx="8" cy="7" r="1.7" fill="currentColor" />
            <circle cx="16" cy="12" r="1.7" fill="currentColor" />
            <circle cx="12" cy="17" r="1.7" fill="currentColor" />
        </svg>
    );
}

function EmployeeList({ onRequestRefresh, refreshKey, criteria }) {
    const auth = useAuth();
    const canManage = auth.isHR;
    const [employees, setEmployees] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [pendingRequests, setPendingRequests] = useState({});
    const [loading, setLoading] = useState(true);
    const [viewEmployee, setViewEmployee] = useState(null);
    const [error, setError] = useState("");
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [assigneeView, setAssigneeView] = useState(null);
    const [openActionMenu, setOpenActionMenu] = useState(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [nameQuery, setNameQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [selectedPosition, setSelectedPosition] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState("cards");
    const filtersRef = useRef(null);
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

            if (canManage) {
                const pending = await AssignmentService.getPendingAssignments();
                setPendingRequests(Object.fromEntries(pending.map((request) => [request.assignedEmpId, request])));
            }
            else {
                setPendingRequests({});
            }
        }
        catch (loadError) {
            console.error(loadError);
            setError("Failed to load employees");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refreshKey, canManage]);

    const departments = [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort();
    const positions = [...new Set(employees.map((employee) => employee.position).filter(Boolean))].sort();
    const normalizedQuery = nameQuery.trim().toLowerCase();
    const filteredEmployees = employees.filter((employee) => (
        (selectedDepartment === "all" || employee.department === selectedDepartment) &&
        (selectedPosition === "all" || employee.position === selectedPosition) &&
        (!normalizedQuery || (employee.name || "").toLowerCase().includes(normalizedQuery))
    ));
    const activeFilterCount = [
        nameQuery.trim() ? 1 : 0,
        selectedDepartment !== "all" ? 1 : 0,
        selectedPosition !== "all" ? 1 : 0
    ].reduce((sum, value) => sum + value, 0);
    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeesPerPage));
    const pageStart = (currentPage - 1) * employeesPerPage;
    const visibleEmployees = filteredEmployees.slice(pageStart, pageStart + employeesPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDepartment, selectedPosition, nameQuery, viewMode]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        if (!filtersOpen) return undefined;

        const onPointerDown = (event) => {
            if (!filtersRef.current?.contains(event.target)) {
                setFiltersOpen(false);
            }
        };

        window.addEventListener("pointerdown", onPointerDown);
        return () => window.removeEventListener("pointerdown", onPointerDown);
    }, [filtersOpen]);

    const clearFilters = () => {
        setNameQuery("");
        setSelectedDepartment("all");
        setSelectedPosition("all");
        setCurrentPage(1);
    };

    const handleSeeAssignees = async (employee) => {
        const isLineManager = criteria.allowedDesignations.includes(employee.position);
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
        catch (deleteError) {
            console.error(deleteError);
            setError(deleteError.response?.data?.message || "Failed to delete employee");
        }
    };

    if (loading) {
        return <div className="panel-state"><h2>Loading employees...</h2></div>;
    }

    if (error && employees.length === 0) {
        return <div className="panel-state error"><h2>{error}</h2></div>;
    }

    const renderActions = (employee, assignment, pendingRequest, isLineManager) => {
        if (!canManage) return null;
        return (
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
        );
    };

    return (
        <div className="employee-list-section">
            <p className="eyebrow">Team roster</p>

            <div className="section-header roster-header">
                <div>
                    <h2>Employees</h2>
                </div>
                <div className="roster-header-actions">
                    <div className="roster-filters" ref={filtersRef}>
                        <button
                            type="button"
                            className={`roster-filter-btn${filtersOpen || activeFilterCount > 0 ? " active" : ""}`}
                            onClick={() => setFiltersOpen((current) => !current)}
                            aria-expanded={filtersOpen}
                            aria-label="Open filters"
                            title="Filters"
                        >
                            <FilterIcon />
                            {activeFilterCount > 0 && (
                                <span className="roster-filter-count">{activeFilterCount}</span>
                            )}
                        </button>

                        {filtersOpen && (
                            <div className="roster-filter-panel" role="dialog" aria-label="Employee filters">
                                <div className="roster-filter-panel-head">
                                    <h3>Filters</h3>
                                    <button
                                        type="button"
                                        className="text-btn"
                                        onClick={clearFilters}
                                        disabled={activeFilterCount === 0}
                                    >
                                        Clear
                                    </button>
                                </div>

                                <label className="roster-filter-field">
                                    <span className="meta-label">Search by name</span>
                                    <input
                                        type="search"
                                        value={nameQuery}
                                        onChange={(event) => setNameQuery(event.target.value)}
                                        placeholder="Type an employee name..."
                                        autoFocus
                                    />
                                </label>

                                <label className="roster-filter-field">
                                    <span className="meta-label">Department</span>
                                    <select
                                        className="department-filter"
                                        value={selectedDepartment}
                                        onChange={(event) => setSelectedDepartment(event.target.value)}
                                        aria-label="Filter employees by department"
                                    >
                                        <option value="all">All departments</option>
                                        {departments.map((department) => (
                                            <option key={department} value={department}>{department}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="roster-filter-field">
                                    <span className="meta-label">Position</span>
                                    <select
                                        className="department-filter"
                                        value={selectedPosition}
                                        onChange={(event) => setSelectedPosition(event.target.value)}
                                        aria-label="Filter employees by position"
                                    >
                                        <option value="all">All positions</option>
                                        {positions.map((position) => (
                                            <option key={position} value={position}>{position}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="view-toggle" role="group" aria-label="Employee view mode">
                        <button
                            type="button"
                            className={`view-toggle-btn${viewMode === "cards" ? " active" : ""}`}
                            onClick={() => setViewMode("cards")}
                        >
                            Cards
                        </button>
                        <button
                            type="button"
                            className={`view-toggle-btn${viewMode === "table" ? " active" : ""}`}
                            onClick={() => setViewMode("table")}
                        >
                            Table
                        </button>
                    </div>
                    <span className="counter-pill">
                        {filteredEmployees.length === employees.length
                            ? `${employees.length} total`
                            : `${filteredEmployees.length} / ${employees.length} total`}
                    </span>
                </div>
            </div>

            {error && <p className="modal-message error">{error}</p>}

            <div className="employee-list-scroll">
                {viewMode === "cards" ? (
                    <div className="employee-list">
                        {visibleEmployees.map((employee) => {
                            const assignment = assignments[employee.id];
                            const pendingRequest = pendingRequests[employee.id];
                            const isLineManager = criteria.allowedDesignations.includes(employee.position);
                            const skills = getSkillsText(employee);

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
                                            <span className="meta-label">Position</span>
                                            <strong>{employee.position}</strong>
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
                                        {assignment?.lineManagerName && (
                                            <div className="employee-grid-span">
                                                <span className="meta-label">Line manager</span>
                                                <strong>{assignment.lineManagerName}</strong>
                                            </div>
                                        )}
                                    </div>

                                    <div className="skills-box">
                                        <span className="meta-label">Skills</span>
                                        <p>{skills || "—"}</p>
                                    </div>

                                    {canManage && (
                                        <div className="employee-card-actions">
                                            {renderActions(employee, assignment, pendingRequest, isLineManager)}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="employee-table-wrap">
                        <table className="employee-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Position</th>
                                    <th>Department</th>
                                    <th>Experience</th>
                                    <th>Managed</th>
                                    <th>Line manager</th>
                                    <th>Status</th>
                                    <th>Skills</th>
                                    {canManage && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleEmployees.map((employee) => {
                                    const assignment = assignments[employee.id];
                                    const pendingRequest = pendingRequests[employee.id];
                                    const isLineManager = criteria.allowedDesignations.includes(employee.position);
                                    const skills = getSkillsText(employee);
                                    const status = assignment ? "Assigned" : pendingRequest ? "Requested" : "Open";
                                    const statusClass = assignment ? "assigned" : pendingRequest ? "pending" : "open";

                                    return (
                                        <tr key={employee.id}>
                                            <td>
                                                <strong>{employee.name}</strong>
                                            </td>
                                            <td>{employee.position}</td>
                                            <td>{employee.department}</td>
                                            <td>{employee.experience} yrs</td>
                                            <td>{employee.employeeManaged ?? 0}</td>
                                            <td>{assignment?.lineManagerName || "—"}</td>
                                            <td>
                                                <span className={`status-badge ${statusClass}`}>{status}</span>
                                            </td>
                                            <td className="skills-cell">{skills || "—"}</td>
                                            {canManage && (
                                                <td className="actions-cell">
                                                    {renderActions(employee, assignment, pendingRequest, isLineManager)}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {filteredEmployees.length === 0 && (
                    <div className="empty-state employee-filter-empty">
                        <p>No employees found for these filters.</p>
                    </div>
                )}
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
                                                    <strong>{item.position}</strong>
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
