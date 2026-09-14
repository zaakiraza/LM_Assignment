import { useState } from "react";

function ExcelPreviewModal({ rows, onClose, onAdd, onAddAll, saving, inline = false }) {
    const [pendingRows, setPendingRows] = useState(rows);

    const handleAdd = async (row) => {
        const added = await onAdd(row);
        if (added !== false) {
            setPendingRows((current) => current.filter((item) => item._rowId !== row._rowId));
        }
    };

    const handleAddAll = async () => {
        const added = await onAddAll(pendingRows);
        if (added !== false) {
            setPendingRows([]);
        }
    };

    return (
        <div className={inline ? "excel-preview-inline" : "modal-overlay"}>
            <div className={inline ? "excel-preview-panel" : "modal request-modal excel-preview-modal"}>
                <div className="modal-head">
                    <div>
                        <p className="eyebrow">Import preview</p>
                        <h2>Review employees</h2>
                    </div>
                    {!inline && <button type="button" className="icon-close" onClick={onClose} disabled={saving}>×</button>}
                </div>

                {pendingRows.length === 0 ? (
                    <div className="empty-state"><p>All previewed employees have been added.</p></div>
                ) : (
                    <div className="request-table-wrap">
                        <table className="request-table excel-preview-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Designation</th>
                                    <th>Experience</th>
                                    <th>Department</th>
                                    <th>Skills</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingRows.map((row) => (
                                    <tr key={row._rowId}>
                                        <td>{row.name}</td>
                                        <td>{row.designation}</td>
                                        <td>{row.experience} yrs</td>
                                        <td>{row.department}</td>
                                        <td>{Array.isArray(row.skills) ? row.skills.join(", ") : row.skills}</td>
                                        <td>
                                            <button type="button" className="primary-btn small-btn" disabled={saving} onClick={() => handleAdd(row)}>
                                                Add
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="modal-actions table-footer-actions">
                    <button type="button" className="secondary-btn" onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="button" className="primary-btn" onClick={handleAddAll} disabled={!pendingRows.length || saving}>
                        {saving ? "Adding..." : "Add All"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ExcelPreviewModal;