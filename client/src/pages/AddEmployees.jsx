import { useState } from "react";
import AddEmployeeModal from "../components/AddEmployeeModal";
import ExcelPreviewModal from "../components/ExcelPreviewModal";
import EmployeeService from "../services/employeeService";
import * as XLSX from "xlsx";

function AddEmployees({ onChanged }) {
    const [showSingle, setShowSingle] = useState(false);
    const [previewRows, setPreviewRows] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleExcel = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        try {
            setSaving(true);
            const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            const normalizedRows = rows.map((row, index) => ({
                id: row.id || row.ID || Date.now() + index,
                name: row.name || row.Name || "",
                designation: row.designation || row.Designation || "",
                experience: row.experience ?? row.Experience ?? "",
                department: row.department || row.Department || "",
                skills: String(row.skills || row.Skills || "").split(",").map((skill) => skill.trim()).filter(Boolean),
                _rowId: `${Date.now()}-${index}`
            }));
            if (!normalizedRows.length) throw new Error("The Excel file does not contain any employee rows");
            setPreviewRows(normalizedRows);
        }
        catch (loadError) {
            setError(loadError.message || "Failed to preview employees");
        }
        finally {
            setSaving(false);
        }
    };

    const addOne = async (employee) => {
        try {
            setSaving(true);
            const { _rowId, ...payload } = employee;
            await EmployeeService.createEmployee(payload);
            onChanged?.();
            return true;
        }
        catch (saveError) {
            setError(saveError.response?.data?.message || "Failed to add employee");
            return false;
        }
        finally {
            setSaving(false);
        }
    };

    const addAll = async (employees) => {
        try {
            setSaving(true);
            await EmployeeService.createEmployees(employees.map(({ _rowId, ...employee }) => employee));
            setPreviewRows(null);
            onChanged?.();
            return true;
        }
        catch (saveError) {
            setError(saveError.response?.data?.message || "Failed to add employees");
            return false;
        }
        finally {
            setSaving(false);
        }
    };

    return (
        <section className="page-panel add-employees-page">
            <p className="eyebrow">Employee intake</p>
            <div className="page-heading">
                <div>
                    <h2>Add employees</h2>
                    <p className="page-description">Add one employee manually or review an Excel file before saving.</p>
                </div>
            </div>

            <div className="intake-options">
                <article className="intake-option">
                    <p className="mini-label">Option 01</p>
                    <h3>Single employee</h3>
                    <p>Enter one employee record with the validated form.</p>
                    <button type="button" className="primary-btn" onClick={() => setShowSingle(true)}>Add single employee</button>
                </article>
                <article className="intake-option">
                    <p className="mini-label">Option 02</p>
                    <h3>Bulk import</h3>
                    <p>Preview all Excel rows, then add one or all records.</p>
                    <label className="secondary-btn import-btn intake-upload">
                        Choose Excel file
                        <input type="file" accept=".xlsx,.xls" onChange={handleExcel} disabled={saving} />
                    </label>
                </article>
            </div>

            {error && <p className="modal-message error">{error}</p>}
            {showSingle && <AddEmployeeModal onClose={() => setShowSingle(false)} onAdded={() => { setShowSingle(false); onChanged?.(); }} />}
            {previewRows && (
                <ExcelPreviewModal
                    rows={previewRows}
                    saving={saving}
                    inline
                    onClose={() => setPreviewRows(null)}
                    onAdd={addOne}
                    onAddAll={addAll}
                />
            )}
        </section>
    );
}

export default AddEmployees;
