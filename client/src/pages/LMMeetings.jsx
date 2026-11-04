import { useEffect, useState } from "react";
import MeetingService from "../services/meetingService";
import EmployeeService from "../services/employeeService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function formatWhen(value) {
    try {
        return new Date(value).toLocaleString();
    }
    catch {
        return value;
    }
}

function LMMeetings() {
    const auth = useAuth();
    const toast = useToast();
    const canSchedule = auth.isHR || auth.isLM;
    const [meetings, setMeetings] = useState([]);
    const [assignees, setAssignees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        title: "",
        employeeId: "",
        scheduledAt: "",
        notes: ""
    });

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const rows = await MeetingService.list();
            setMeetings(rows);
            if (auth.isLM && !auth.isHR) {
                const mine = await EmployeeService.getMyAssignees();
                setAssignees(mine);
            }
            else if (auth.isHR) {
                const employees = await EmployeeService.getEmployees();
                setAssignees(employees.filter((employee) => employee.id !== auth.user?.id));
            }
        }
        catch (loadError) {
            setError(loadError.response?.data?.message || "Failed to load meetings");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [auth.isHR, auth.isLM]);

    const handleCreate = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            await MeetingService.create(form);
            toast.success("Meeting scheduled");
            setForm({ title: "", employeeId: "", scheduledAt: "", notes: "" });
            await load();
        }
        catch (saveError) {
            toast.error(saveError.response?.data?.message || "Failed to schedule meeting");
        }
        finally {
            setSaving(false);
        }
    };

    const handleStatus = async (meetingId, status) => {
        try {
            await MeetingService.updateStatus(meetingId, status);
            toast.success(`Meeting marked ${status}`);
            await load();
        }
        catch (updateError) {
            toast.error(updateError.response?.data?.message || "Failed to update meeting");
        }
    };

    if (loading) return <LoadingSpinner label="Loading meetings..." />;

    return (
        <section className="panel panel-main feature-page">
            <p className="eyebrow">Collaboration</p>
            <div className="section-header">
                <div className="section-heading-block">
                    <h2>LM meetings</h2>
                    <p className="page-description">Schedule and track 1:1 meetings between line managers and employees.</p>
                </div>
                <span className="counter-pill">{meetings.length}</span>
            </div>

            {error && <p className="modal-message error">{error}</p>}

            {canSchedule && (
                <form className="feature-form" onSubmit={handleCreate}>
                    <h3>Schedule meeting</h3>
                    <div className="modal-form-grid">
                        <div className="form-field">
                            <label className="field-label">Title</label>
                            <input
                                className="modal-input"
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                placeholder="Weekly 1:1"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label className="field-label">Employee</label>
                            <select
                                className="modal-input"
                                value={form.employeeId}
                                onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
                                required
                            >
                                <option value="">Select employee</option>
                                {assignees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label className="field-label">Date & time</label>
                            <input
                                className="modal-input"
                                type="datetime-local"
                                value={form.scheduledAt}
                                onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label className="field-label">Notes</label>
                            <input
                                className="modal-input"
                                value={form.notes}
                                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                                placeholder="Optional agenda"
                            />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="primary-btn" disabled={saving}>
                            {saving ? "Saving..." : "Schedule"}
                        </button>
                    </div>
                </form>
            )}

            {meetings.length === 0 ? (
                <div className="empty-state requests-empty">
                    <div className="empty-illustration" aria-hidden="true">📅</div>
                    <h3>No meetings yet</h3>
                    <p>Scheduled LM meetings will appear here.</p>
                </div>
            ) : (
                <div className="feature-list">
                    {meetings.map((meeting) => (
                        <article key={meeting.id} className="feature-card">
                            <div className="feature-card-head">
                                <div>
                                    <h3>{meeting.title}</h3>
                                    <p>{formatWhen(meeting.scheduledAt)}</p>
                                </div>
                                <span className={`status-badge ${meeting.status === "scheduled" ? "pending" : meeting.status === "completed" ? "assigned" : "open"}`}>
                                    {meeting.status}
                                </span>
                            </div>
                            <div className="employee-grid">
                                <div>
                                    <span className="meta-label">Employee</span>
                                    <strong>{meeting.employee?.name || "—"}</strong>
                                </div>
                                <div>
                                    <span className="meta-label">Line manager</span>
                                    <strong>{meeting.lineManager?.name || "—"}</strong>
                                </div>
                            </div>
                            {meeting.notes && <p className="feature-notes">{meeting.notes}</p>}
                            {canSchedule && meeting.status === "scheduled" && (
                                <div className="modal-actions">
                                    <button type="button" className="secondary-btn small-btn" onClick={() => handleStatus(meeting.id, "cancelled")}>
                                        Cancel
                                    </button>
                                    <button type="button" className="primary-btn small-btn" onClick={() => handleStatus(meeting.id, "completed")}>
                                        Mark completed
                                    </button>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default LMMeetings;
