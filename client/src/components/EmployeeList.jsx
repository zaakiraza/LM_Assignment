import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import AssignmentService from "../services/assignmentService";
import AssignLMModal from "./AssignLMModal";
import ViewLMModal from "./ViewLMModal";
import AddEmployeeModal from "./AddEmployeeModal";
import EditEmployeeModal from "./EditEmployeeModal";
import ExcelPreviewModal from "./ExcelPreviewModal";
import * as XLSX from "xlsx";

function EmployeeList({ onRequestRefresh, refreshKey, criteria }) {
    const [employees, setEmployees] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewEmployee, setViewEmployee] = useState(null);
    const [error, setError] = useState("");
    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [assigneeView, setAssigneeView] = useState(null);
    const [importing, setImporting] = useState(false);
    const [previewRows, setPreviewRows] = useState(null);

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
    }, [refreshKey]);

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

    const handleImportEmployees = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        try {
            setImporting(true);
            const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const spreadsheetRows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
            const normalizedRows = spreadsheetRows.map((row, index) => ({
                id: row.id || row.ID || Date.now() + index,
                name: row.name || row.Name || "",
                designation: row.designation || row.Designation || "",
                experience: row.experience ?? row.Experience ?? "",
                department: row.department || row.Department || "",
                skills: String(row.skills || row.Skills || "").split(",").map((skill) => skill.trim()).filter(Boolean),
                _rowId: `${Date.now()}-${index}`
            }));

            if (!normalizedRows.length) {
                throw new Error("The Excel file does not contain any employee rows");
            }

            setPreviewRows(normalizedRows);
        }
        catch (importError) {
            console.error(importError);
            setError(importError.response?.data?.message || importError.message || "Failed to preview employees");
        }
        finally {
            setImporting(false);
        }
    };

    const addPreviewEmployee = async (employee) => {
        try {
            setImporting(true);
            const { _rowId, ...payload } = employee;
            await EmployeeService.createEmployee(payload);
            await fetchData();
            onRequestRefresh?.();
            return true;
        }
        catch (addError) {
            console.error(addError);
            setError(addError.response?.data?.message || "Failed to add employee");
            return false;
        }
        finally {
            setImporting(false);
        }
    };

    const addAllPreviewEmployees = async (employeesToAdd) => {
        try {
            setImporting(true);
            const payload = employeesToAdd.map(({ _rowId, ...employee }) => employee);
            await EmployeeService.createEmployees(payload);
            await fetchData();
            onRequestRefresh?.();
            setPreviewRows(null);
            return true;
        }
        catch (addError) {
            console.error(addError);
            setError(addError.response?.data?.message || "Failed to add employees");
            return false;
        }
        finally {
            setImporting(false);
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
                    <button
                        className="primary-btn"
                        onClick={() => setShowAddEmployee(true)}
                    >
                        + Add Employee
                    </button>
                    <label className="secondary-btn import-btn">
                        {importing ? "Importing..." : "Import Excel"}
                        <input type="file" accept=".xlsx,.xls" onChange={handleImportEmployees} disabled={importing} />
                    </label>
                </div>
                <span className="counter-pill">{employees.length} total</span>
            </div>

            {showAddEmployee && (
                <AddEmployeeModal
                    onClose={() => setShowAddEmployee(false)}
                    onAdded={() => fetchData()}
                />
            )}

            {previewRows && (
                <ExcelPreviewModal
                    rows={previewRows}
                    saving={importing}
                    onClose={() => setPreviewRows(null)}
                    onAdd={addPreviewEmployee}
                    onAddAll={addAllPreviewEmployees}
                />
            )}

            <div className="employee-list">
                {employees.map((employee) => {
                    const assignment = assignments[employee.id];
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
                    criteria={criteria}
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