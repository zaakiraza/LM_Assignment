import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import { POSITIONS } from "../config/positions";

function EditEmployeeModal({ employee, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: "",
        position: "",
        experience: "",
        department: "",
        skills: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!employee) return;
        const skillValues = Array.isArray(employee.skills)
            ? employee.skills
            : (() => {
                if (typeof employee.skills === "string") {
                    try {
                        const parsed = JSON.parse(employee.skills);
                        return Array.isArray(parsed) ? parsed : String(parsed).split(",");
                    }
                    catch {
                        return employee.skills.split(",");
                    }
                }
                return [];
            })();

        setForm({
            name: employee.name || "",
            position: employee.position || employee.designation || "",
            experience: employee.experience ?? "",
            department: employee.department || "",
            skills: skillValues.join(", ")
        });
    }, [employee]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            setSubmitting(true);
            setError("");
            await EmployeeService.updateEmployee(employee.id, {
                name: form.name.trim(),
                position: form.position,
                experience: Number(form.experience),
                department: form.department,
                skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
            });
            onSaved();
            onClose();
        }
        catch (saveError) {
            console.error(saveError);
            setError(saveError.response?.data?.message || "Failed to update employee");
        }
        finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal modal-compact">
                <div className="modal-head">
                    <div>
                        <p className="eyebrow">Employee</p>
                        <h2>Edit Employee</h2>
                    </div>
                    <button type="button" className="icon-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <label className="field-label">Name</label>
                    <input className="modal-input" name="name" value={form.name} onChange={handleChange} required />

                    <label className="field-label">Position</label>
                    <select className="modal-input" name="position" value={form.position} onChange={handleChange} required>
                        <option value="">Select position</option>
                        {POSITIONS.map((position) => (
                            <option key={position} value={position}>{position}</option>
                        ))}
                    </select>

                    <label className="field-label">Experience</label>
                    <input className="modal-input" name="experience" type="number" min="0" value={form.experience} onChange={handleChange} required />

                    <label className="field-label">Department</label>
                    <select className="modal-input" name="department" value={form.department} onChange={handleChange} required>
                        <option value="">Select department</option>
                        <option value="netSuite">netSuite</option>
                        <option value="App dev">App dev</option>
                        <option value="IT">IT</option>
                        <option value="HR">HR</option>
                    </select>

                    <label className="field-label">Skills</label>
                    <input className="modal-input" name="skills" value={form.skills} onChange={handleChange} placeholder="JavaScript, React, Node.js" required />

                    {error && <p className="modal-message error">{error}</p>}

                    <div className="modal-actions">
                        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={submitting}>
                            {submitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditEmployeeModal;
