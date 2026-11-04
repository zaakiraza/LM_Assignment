import { useState } from "react";
import AddEmployeeModal from "../components/AddEmployeeModal";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../context/ToastContext";
import { mapExcelRows, validateExcelFile } from "../utils/excelImport";
import * as XLSX from "xlsx";

function AddEmployees({ onChanged, onClose, onExcelReady, asModal = false }) {
    const toast = useToast();
    const [showSingle, setShowSingle] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState("");

    const handleExcel = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        setError("");
        if (!file) return;

        try {
            validateExcelFile(file);
            setParsing(true);
            const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
            if (!workbook.SheetNames?.length) {
                throw new Error("The Excel file does not contain any sheets");
            }
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            const normalizedRows = mapExcelRows(rows);
            toast.success(`${normalizedRows.length} row(s) ready in the employees table`);
            onExcelReady?.(normalizedRows);
            onClose?.();
        }
        catch (loadError) {
            const message = loadError.message || "Failed to read Excel file";
            setError(message);
            toast.error(message);
        }
        finally {
            setParsing(false);
        }
    };

    const content = (
        <>
            <div className="modal-head">
                <div>
                    <p className="eyebrow">Employee intake</p>
                    <h2>Add employees</h2>
                    <p className="page-description">
                        Add one employee manually or upload Excel with columns:
                        name, position, experience, department, skills (email optional). Max 5 MB.
                    </p>
                </div>
                {onClose && (
                    <button type="button" className="icon-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                )}
            </div>

            <div className="intake-options">
                <article className="intake-option">
                    <p className="mini-label">Option 01</p>
                    <h3>Single employee</h3>
                    <p>Enter one employee record with the validated form.</p>
                    <button type="button" className="primary-btn" onClick={() => setShowSingle(true)}>
                        Add single employee
                    </button>
                </article>
                <article className="intake-option">
                    <p className="mini-label">Option 02</p>
                    <h3>Bulk import</h3>
                    <p>Validated rows open in the main employees table so you can add them one by one or all at once.</p>
                    <label className={`secondary-btn import-btn intake-upload${parsing ? " disabled" : ""}`}>
                        {parsing ? "Reading file..." : "Choose Excel file"}
                        <input type="file" accept=".xlsx,.xls" onChange={handleExcel} disabled={parsing} />
                    </label>
                </article>
            </div>

            {parsing && <LoadingSpinner label="Validating Excel file..." compact />}
            {error && <p className="modal-message error">{error}</p>}
        </>
    );

    return (
        <>
            {asModal ? (
                <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add employees">
                    <div className="modal add-employees-modal">
                        {content}
                    </div>
                </div>
            ) : (
                <section className="page-panel add-employees-page">
                    {content}
                </section>
            )}

            {showSingle && (
                <AddEmployeeModal
                    onClose={() => setShowSingle(false)}
                    onAdded={() => {
                        setShowSingle(false);
                        toast.success("Employee added");
                        onChanged?.();
                        onClose?.();
                    }}
                />
            )}
        </>
    );
}

export default AddEmployees;
