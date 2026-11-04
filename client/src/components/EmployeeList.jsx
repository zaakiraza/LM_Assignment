import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EmployeeService from "../services/employeeService";
import AssignmentService from "../services/assignmentService";
import ViewLMModal from "./ViewLMModal";
import EditEmployeeModal from "./EditEmployeeModal";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

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

function EmployeeList({
    onRequestRefresh,
    refreshKey,
    criteria,
    canAddEmployees = false,
    onAddEmployees,
    importRows = [],
    onImportRowsChange
}) {
    const auth = useAuth();
    const toast = useToast();
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
    const [menuPosition, setMenuPosition] = useState(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const emptyFilters = {
        nameQuery: "",
        selectedDepartment: "all",
        selectedPosition: "all",
        minExperience: "",
        maxExperience: "",
        skillQuery: ""
    };
    const [draftFilters, setDraftFilters] = useState(emptyFilters);
    const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [assignmentFilter, setAssignmentFilter] = useState("all");
    const [importSaving, setImportSaving] = useState(false);
    const filtersRef = useRef(null);
    const employeesPerPage = 10;
    const isImportMode = importRows.length > 0;

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

    const sourceEmployees = isImportMode ? importRows : employees;
    const departments = [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort();
    const positions = [...new Set(employees.map((employee) => employee.position).filter(Boolean))].sort();
    const normalizedQuery = appliedFilters.nameQuery.trim().toLowerCase();
    const normalizedSkill = appliedFilters.skillQuery.trim().toLowerCase();
    const minExp = appliedFilters.minExperience === "" ? null : Number(appliedFilters.minExperience);
    const maxExp = appliedFilters.maxExperience === "" ? null : Number(appliedFilters.maxExperience);

    const filteredEmployees = sourceEmployees.filter((employee) => {
        if (isImportMode) {
            return (
                (!normalizedQuery || (employee.name || "").toLowerCase().includes(normalizedQuery))
                && (appliedFilters.selectedDepartment === "all" || employee.department === appliedFilters.selectedDepartment)
                && (appliedFilters.selectedPosition === "all" || employee.position === appliedFilters.selectedPosition)
            );
        }

        const experience = Number(employee.experience) || 0;
        const skillsText = getSkillsText(employee).toLowerCase();
        const isAssigned = Boolean(assignments[employee.id]);

        return (
            (appliedFilters.selectedDepartment === "all" || employee.department === appliedFilters.selectedDepartment)
            && (appliedFilters.selectedPosition === "all" || employee.position === appliedFilters.selectedPosition)
            && (!normalizedQuery || (employee.name || "").toLowerCase().includes(normalizedQuery))
            && (minExp === null || Number.isNaN(minExp) || experience >= minExp)
            && (maxExp === null || Number.isNaN(maxExp) || experience <= maxExp)
            && (!normalizedSkill || skillsText.includes(normalizedSkill))
            && (assignmentFilter === "all"
                || (assignmentFilter === "assigned" && isAssigned)
                || (assignmentFilter === "unassigned" && !isAssigned))
        );
    });

    const activeFilterCount = [
        appliedFilters.nameQuery.trim() ? 1 : 0,
        appliedFilters.selectedDepartment !== "all" ? 1 : 0,
        appliedFilters.selectedPosition !== "all" ? 1 : 0,
        appliedFilters.minExperience !== "" ? 1 : 0,
        appliedFilters.maxExperience !== "" ? 1 : 0,
        appliedFilters.skillQuery.trim() ? 1 : 0
    ].reduce((sum, value) => sum + value, 0);

    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeesPerPage));
    const pageStart = (currentPage - 1) * employeesPerPage;
    const visibleEmployees = filteredEmployees.slice(pageStart, pageStart + employeesPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [appliedFilters, assignmentFilter]);

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

    useEffect(() => {
        if (!openActionMenu) return undefined;

        const closeMenu = () => {
            setOpenActionMenu(null);
            setMenuPosition(null);
        };

        const onScrollOrResize = () => closeMenu();
        const onPointerDown = (event) => {
            if (event.target.closest?.(".action-menu") || event.target.closest?.(".menu-btn")) return;
            closeMenu();
        };

        window.addEventListener("scroll", onScrollOrResize, true);
        window.addEventListener("resize", onScrollOrResize);
        window.addEventListener("pointerdown", onPointerDown);
        return () => {
            window.removeEventListener("scroll", onScrollOrResize, true);
            window.removeEventListener("resize", onScrollOrResize);
            window.removeEventListener("pointerdown", onPointerDown);
        };
    }, [openActionMenu]);

    const updateDraft = (key, value) => {
        setDraftFilters((current) => ({ ...current, [key]: value }));
    };

    const applyFilters = () => {
        setAppliedFilters(draftFilters);
        setCurrentPage(1);
        setFiltersOpen(false);
    };

    const clearFilters = () => {
        setDraftFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
        setCurrentPage(1);
    };

    const openFilters = () => {
        setDraftFilters(appliedFilters);
        setFiltersOpen((current) => !current);
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
        const hasAssignment = Boolean(assignments[employee.id]);
        const confirmText = hasAssignment
            ? `Request a Change LM for ${employee.name}?`
            : `Create an LM request for ${employee.name}?`;
        if (!window.confirm(confirmText)) return;
        try {
            await AssignmentService.createAssignment(employee.id, null, criteria);
            toast.success(
                hasAssignment
                    ? `Change LM request created for ${employee.name}`
                    : `LM request created for ${employee.name}`
            );
            await fetchData();
            onRequestRefresh?.();
        }
        catch (requestError) {
            const message = requestError.response?.data?.message || "Failed to create LM request";
            setError(message);
            toast.error(message);
        }
    };

    const handleUndoRequest = async (employee) => {
        const request = pendingRequests[employee.id];
        if (!request) return;
        if (!window.confirm(`Undo the LM request for ${employee.name}?`)) return;

        try {
            await AssignmentService.cancelPendingAssignment(request.assignmentId);
            toast.success(`LM request undone for ${employee.name}`);
            await fetchData();
            onRequestRefresh?.();
        }
        catch (cancelError) {
            const message = cancelError.response?.data?.message || "Failed to undo LM request";
            setError(message);
            toast.error(message);
        }
    };

    const handleDeleteEmployee = async (employee) => {
        const confirmed = window.confirm(`Delete ${employee.name}? This will remove the employee record.`);
        if (!confirmed) return;
        try {
            await EmployeeService.deleteEmployee(employee.id);
            toast.success(`${employee.name} deleted`);
            await fetchData();
            onRequestRefresh?.();
        }
        catch (deleteError) {
            console.error(deleteError);
            const message = deleteError.response?.data?.message || "Failed to delete employee";
            setError(message);
            toast.error(message);
        }
    };

    const cancelImport = () => {
        if (importSaving) return;
        if (importRows.length > 0 && !window.confirm("Cancel Excel import? Unsaved rows will be discarded.")) {
            return;
        }
        onImportRowsChange?.([]);
        toast.info("Excel import cancelled");
    };

    const addImportRow = async (row) => {
        try {
            setImportSaving(true);
            const { _rowId, ...payload } = row;
            await EmployeeService.createEmployee({
                ...payload,
                experience: Number(payload.experience) || 0,
                employeeManaged: 0,
                isVerified: true
            });
            onImportRowsChange?.(importRows.filter((item) => item._rowId !== row._rowId));
            toast.success(`${row.name || "Employee"} added`);
            await fetchData();
            onRequestRefresh?.();
        }
        catch (saveError) {
            const message = saveError.response?.data?.message || "Failed to add employee";
            setError(message);
            toast.error(message);
        }
        finally {
            setImportSaving(false);
        }
    };

    const addAllImportRows = async () => {
        if (!importRows.length) return;
        if (!window.confirm(`Add all ${importRows.length} employee(s) from this Excel import?`)) return;

        try {
            setImportSaving(true);
            await EmployeeService.createEmployees(importRows.map(({ _rowId, ...employee }) => ({
                ...employee,
                experience: Number(employee.experience) || 0,
                employeeManaged: 0,
                isVerified: true
            })));
            const count = importRows.length;
            onImportRowsChange?.([]);
            toast.success(`${count} employee(s) added`);
            await fetchData();
            onRequestRefresh?.();
        }
        catch (saveError) {
            const message = saveError.response?.data?.message || "Failed to add employees";
            setError(message);
            toast.error(message);
        }
        finally {
            setImportSaving(false);
        }
    };

    const discardImportRow = (row) => {
        onImportRowsChange?.(importRows.filter((item) => item._rowId !== row._rowId));
    };

    const closeActionMenu = () => {
        setOpenActionMenu(null);
        setMenuPosition(null);
    };

    const toggleActionMenu = (employeeId, event) => {
        event.stopPropagation();
        if (openActionMenu === employeeId) {
            closeActionMenu();
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const menuWidth = 180;
        const estimatedHeight = 220;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
        const left = Math.min(
            Math.max(12, rect.right - menuWidth),
            window.innerWidth - menuWidth - 12
        );

        setMenuPosition({
            top: openUp ? rect.top - 8 : rect.bottom + 8,
            left,
            openUp
        });
        setOpenActionMenu(employeeId);
    };

    if (loading) {
        return <LoadingSpinner label="Loading employees..." />;
    }

    if (error && employees.length === 0) {
        return <div className="panel-state error"><h2>{error}</h2></div>;
    }

    const renderActions = (employee) => {
        if (!canManage) return null;
        return (
            <div className="employee-action-menu">
                <button
                    type="button"
                    className="menu-btn"
                    aria-label={`Open actions for ${employee.name}`}
                    aria-expanded={openActionMenu === employee.id}
                    onClick={(event) => toggleActionMenu(employee.id, event)}
                >
                    <span aria-hidden="true">⋮</span>
                </button>
            </div>
        );
    };

    const openMenuEmployee = employees.find((employee) => employee.id === openActionMenu);
    const openMenuAssignment = openMenuEmployee ? assignments[openMenuEmployee.id] : null;
    const openMenuPending = openMenuEmployee ? pendingRequests[openMenuEmployee.id] : null;
    const openMenuIsLM = openMenuEmployee
        ? criteria.allowedDesignations.includes(openMenuEmployee.position)
        : false;

    return (
        <div className="employee-list-section">
            <p className="eyebrow">{isImportMode ? "Excel import" : "Team roster"}</p>

            <div className="section-header roster-header">
                <div>
                    <h2>{isImportMode ? "Review import" : "Employees"}</h2>
                </div>
                <div className="roster-header-actions">
                    {isImportMode ? (
                        <>
                            <button
                                type="button"
                                className="secondary-btn small-btn"
                                onClick={cancelImport}
                                disabled={importSaving}
                            >
                                Cancel import
                            </button>
                            <button
                                type="button"
                                className="primary-btn small-btn"
                                onClick={addAllImportRows}
                                disabled={importSaving || importRows.length === 0}
                            >
                                {importSaving ? "Adding..." : "Add all"}
                            </button>
                        </>
                    ) : (
                    <>
                    <div className="roster-filters" ref={filtersRef}>
                        <button
                            type="button"
                            className={`roster-filter-btn${filtersOpen || activeFilterCount > 0 ? " active" : ""}`}
                            onClick={openFilters}
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
                                        disabled={activeFilterCount === 0
                                            && !draftFilters.nameQuery
                                            && draftFilters.selectedDepartment === "all"
                                            && draftFilters.selectedPosition === "all"
                                            && draftFilters.minExperience === ""
                                            && draftFilters.maxExperience === ""
                                            && !draftFilters.skillQuery}
                                    >
                                        Clear
                                    </button>
                                </div>

                                <label className="roster-filter-field">
                                    <span className="meta-label">Search by name</span>
                                    <input
                                        type="search"
                                        value={draftFilters.nameQuery}
                                        onChange={(event) => updateDraft("nameQuery", event.target.value)}
                                        placeholder="Type an employee name..."
                                        autoFocus
                                    />
                                </label>

                                <label className="roster-filter-field">
                                    <span className="meta-label">Department</span>
                                    <select
                                        className="department-filter"
                                        value={draftFilters.selectedDepartment}
                                        onChange={(event) => updateDraft("selectedDepartment", event.target.value)}
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
                                        value={draftFilters.selectedPosition}
                                        onChange={(event) => updateDraft("selectedPosition", event.target.value)}
                                        aria-label="Filter employees by position"
                                    >
                                        <option value="all">All positions</option>
                                        {positions.map((position) => (
                                            <option key={position} value={position}>{position}</option>
                                        ))}
                                    </select>
                                </label>

                                <div className="roster-filter-row">
                                    <label className="roster-filter-field">
                                        <span className="meta-label">Min experience</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={draftFilters.minExperience}
                                            onChange={(event) => updateDraft("minExperience", event.target.value)}
                                            placeholder="0"
                                        />
                                    </label>
                                    <label className="roster-filter-field">
                                        <span className="meta-label">Max experience</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={draftFilters.maxExperience}
                                            onChange={(event) => updateDraft("maxExperience", event.target.value)}
                                            placeholder="Any"
                                        />
                                    </label>
                                </div>

                                <label className="roster-filter-field">
                                    <span className="meta-label">Skills</span>
                                    <input
                                        type="search"
                                        value={draftFilters.skillQuery}
                                        onChange={(event) => updateDraft("skillQuery", event.target.value)}
                                        placeholder="e.g. React"
                                    />
                                </label>

                                <button type="button" className="primary-btn full" onClick={applyFilters}>
                                    Apply filters
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="view-toggle" role="group" aria-label="Assignment status filter">
                        <button
                            type="button"
                            className={`view-toggle-btn${assignmentFilter === "all" ? " active" : ""}`}
                            onClick={() => setAssignmentFilter("all")}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            className={`view-toggle-btn${assignmentFilter === "assigned" ? " active" : ""}`}
                            onClick={() => setAssignmentFilter("assigned")}
                        >
                            Assigned
                        </button>
                        <button
                            type="button"
                            className={`view-toggle-btn${assignmentFilter === "unassigned" ? " active" : ""}`}
                            onClick={() => setAssignmentFilter("unassigned")}
                        >
                            Unassigned
                        </button>
                    </div>
                    {canAddEmployees && (
                        <button
                            type="button"
                            className="primary-btn small-btn"
                            onClick={onAddEmployees}
                        >
                            Add employees
                        </button>
                    )}
                    </>
                    )}
                </div>

            </div>

            {error && <p className="modal-message error">{error}</p>}

            <div className="employee-list-scroll">
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
                                {(canManage || isImportMode) && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleEmployees.map((employee) => {
                                if (isImportMode) {
                                    const skills = getSkillsText(employee);
                                    return (
                                        <tr key={employee._rowId}>
                                            <td>
                                                <strong>{employee.name}</strong>
                                            </td>
                                            <td>{employee.position}</td>
                                            <td>{employee.department}</td>
                                            <td>{employee.experience} yrs</td>
                                            <td>—</td>
                                            <td>—</td>
                                            <td>
                                                <span className="status-badge pending">Import</span>
                                            </td>
                                            <td className="skills-cell">{skills || "—"}</td>
                                            <td className="actions-cell">
                                                <div className="import-row-actions">
                                                    <button
                                                        type="button"
                                                        className="primary-btn small-btn"
                                                        disabled={importSaving}
                                                        onClick={() => addImportRow(employee)}
                                                    >
                                                        Add
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="secondary-btn small-btn"
                                                        disabled={importSaving}
                                                        onClick={() => discardImportRow(employee)}
                                                    >
                                                        Discard
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                const assignment = assignments[employee.id];
                                const pendingRequest = pendingRequests[employee.id];
                                const skills = getSkillsText(employee);
                                const status = assignment && pendingRequest
                                    ? "Change requested"
                                    : assignment
                                        ? "Assigned"
                                        : pendingRequest
                                            ? "Requested"
                                            : "Open";
                                const statusClass = assignment && pendingRequest
                                    ? "pending"
                                    : assignment
                                        ? "assigned"
                                        : pendingRequest
                                            ? "pending"
                                            : "open";

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
                                                {renderActions(employee)}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredEmployees.length === 0 && (
                    <div className="empty-state employee-filter-empty">
                        <p>No employees found for these filters.</p>
                    </div>
                )}
            </div>

            <div className="pagination-controls" aria-label="Employee pagination">
                <button
                    type="button"
                    className="secondary-btn small-btn"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1 || totalPages <= 1}
                >
                    Previous
                </button>
                <span className="pagination-meta">
                    {filteredEmployees.length > employeesPerPage
                        ? `Page ${currentPage} of ${totalPages}`
                        : "Page 1 of 1"}
                </span>
                <button
                    type="button"
                    className="secondary-btn small-btn"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages || totalPages <= 1}
                >
                    Next
                </button>
                <span className="counter-pill">
                    {isImportMode
                        ? `${importRows.length} import row${importRows.length === 1 ? "" : "s"}`
                        : filteredEmployees.length === employees.length
                            ? `${employees.length} total`
                            : `${filteredEmployees.length} / ${employees.length} total`}
                </span>
            </div>

            {openMenuEmployee && menuPosition && createPortal(
                <div
                    className={`action-menu action-menu-fixed${menuPosition.openUp ? " open-up" : ""}`}
                    role="menu"
                    style={{
                        top: menuPosition.openUp ? "auto" : menuPosition.top,
                        bottom: menuPosition.openUp ? window.innerHeight - menuPosition.top : "auto",
                        left: menuPosition.left
                    }}
                >
                    {openMenuAssignment && (
                        <button type="button" className="action-menu-item" onClick={() => { setViewEmployee(openMenuEmployee); closeActionMenu(); }}>
                            View LM
                        </button>
                    )}
                    {openMenuAssignment && !openMenuPending && (
                        <button
                            type="button"
                            className="action-menu-item action-menu-primary"
                            onClick={() => {
                                handleRequestLM(openMenuEmployee);
                                closeActionMenu();
                            }}
                        >
                            Change LM
                        </button>
                    )}
                    {!openMenuAssignment && openMenuPending && (
                        <button type="button" className="action-menu-item action-menu-danger" onClick={() => { handleUndoRequest(openMenuEmployee); closeActionMenu(); }}>
                            Undo request
                        </button>
                    )}
                    {!openMenuAssignment && !openMenuPending && (
                        <button type="button" className="action-menu-item action-menu-primary" onClick={() => { handleRequestLM(openMenuEmployee); closeActionMenu(); }}>
                            Request LM
                        </button>
                    )}
                    {openMenuAssignment && openMenuPending && (
                        <button type="button" className="action-menu-item action-menu-danger" onClick={() => { handleUndoRequest(openMenuEmployee); closeActionMenu(); }}>
                            Undo change request
                        </button>
                    )}
                    <button type="button" className="action-menu-item" onClick={() => { handleEditEmployee(openMenuEmployee); closeActionMenu(); }}>
                        Edit
                    </button>
                    <button type="button" className="action-menu-item action-menu-danger" onClick={() => { handleDeleteEmployee(openMenuEmployee); closeActionMenu(); }}>
                        Delete
                    </button>
                    {openMenuIsLM && (
                        <button type="button" className="action-menu-item" onClick={() => { handleSeeAssignees(openMenuEmployee); closeActionMenu(); }}>
                            See Assignees
                        </button>
                    )}
                </div>,
                document.body
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
