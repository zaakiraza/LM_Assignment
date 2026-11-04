import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import AssignmentService from "../services/assignmentService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Profile() {
    const auth = useAuth();
    const toast = useToast();
    const [employee, setEmployee] = useState(null);
    const [assignment, setAssignment] = useState(null);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const profile = await EmployeeService.getMyProfile();
            setEmployee(profile);
            const [currentAssignment, pending] = await Promise.all([
                AssignmentService.getEmployeeAssignment(profile.id),
                AssignmentService.getMyPendingAssignment()
            ]);
            setAssignment(currentAssignment);
            setPendingRequest(pending);
        }
        catch (loadError) {
            setError(loadError.response?.data?.message || "Failed to load profile");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleRequestLM = async ({ isChange = false } = {}) => {
        if (!employee) return;
        const confirmText = isChange
            ? "Request a change of line manager? HR will review it on the Requests page."
            : "Request a line manager assignment?";
        if (!window.confirm(confirmText)) return;

        try {
            setActing(true);
            setError("");
            setMessage("");
            await AssignmentService.createAssignment(employee.id, null);
            const successText = isChange
                ? "Change LM request sent. HR can see it on the Requests page."
                : "LM request sent. HR can see it on the Requests page.";
            setMessage(successText);
            toast.success(successText);
            await load();
        }
        catch (requestError) {
            const text = requestError.response?.data?.message || "Failed to create LM request";
            setError(text);
            toast.error(text);
        }
        finally {
            setActing(false);
        }
    };

    const handleUndoRequest = async () => {
        if (!pendingRequest) return;
        if (!window.confirm("Cancel your pending LM request?")) return;
        try {
            setActing(true);
            setError("");
            setMessage("");
            await AssignmentService.cancelPendingAssignment(pendingRequest.assignmentId);
            setMessage("LM request cancelled.");
            toast.success("LM request cancelled");
            await load();
        }
        catch (cancelError) {
            const text = cancelError.response?.data?.message || "Failed to cancel LM request";
            setError(text);
            toast.error(text);
        }
        finally {
            setActing(false);
        }
    };

    if (loading) return <LoadingSpinner label="Loading profile..." />;
    if (error && !employee) return <div className="panel-state error"><h2>{error}</h2></div>;
    if (!employee) return null;

    return (
        <section className="panel panel-main">
            <p className="eyebrow">My profile</p>
            <div className="section-header">
                <div>
                    <h2>{employee.name}</h2>
                    <p>{auth.user?.email}</p>
                </div>
                <span className="counter-pill">{employee.position || auth.position || "Employee"}</span>
            </div>

            <article className="employee-card profile-card">
                <div className="employee-grid">
                    <div>
                        <span className="meta-label">Role</span>
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
                </div>
                <div className="skills-box">
                    <span className="meta-label">Skills</span>
                    <p>{(employee.skills || []).join(", ") || "—"}</p>
                </div>
            </article>

            <div className="profile-assignment">
                <h3>Line manager</h3>
                {assignment ? (
                    <div className="profile-request-state">
                        <article className="employee-card profile-lm-card">
                            <div className="employee-grid">
                                <div>
                                    <span className="meta-label">Name</span>
                                    <strong>{assignment.lineManagerName || "—"}</strong>
                                </div>
                                <div>
                                    <span className="meta-label">Position</span>
                                    <strong>{assignment.lineManagerDesignation || "—"}</strong>
                                </div>
                                <div>
                                    <span className="meta-label">Experience</span>
                                    <strong>{assignment.lineManagerExperience ?? 0} yrs</strong>
                                </div>
                                <div>
                                    <span className="meta-label">Department</span>
                                    <strong>{assignment.lineManagerDepartment || "—"}</strong>
                                </div>
                                <div>
                                    <span className="meta-label">Managed</span>
                                    <strong>{assignment.lineManagerEmployeeManaged ?? 0}</strong>
                                </div>
                            </div>
                            <div className="skills-box">
                                <span className="meta-label">Skills</span>
                                <p>
                                    {Array.isArray(assignment.lineManagerSkills)
                                        ? assignment.lineManagerSkills.join(", ")
                                        : (assignment.lineManagerSkills || "—")}
                                </p>
                            </div>
                        </article>

                        {pendingRequest ? (
                            <>
                                <p className="modal-message warning">
                                    Change LM request pending. Waiting for HR to assign a new line manager.
                                </p>
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    disabled={acting}
                                    onClick={handleUndoRequest}
                                >
                                    {acting ? "Cancelling..." : "Undo change request"}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="primary-btn"
                                disabled={acting}
                                onClick={() => handleRequestLM({ isChange: true })}
                            >
                                {acting ? "Requesting..." : "Change LM"}
                            </button>
                        )}
                    </div>
                ) : pendingRequest ? (
                    <div className="profile-request-state">
                        <p className="modal-message warning">
                            LM request pending. Waiting for HR to assign a line manager.
                        </p>
                        <button
                            type="button"
                            className="secondary-btn"
                            disabled={acting}
                            onClick={handleUndoRequest}
                        >
                            {acting ? "Cancelling..." : "Undo request"}
                        </button>
                    </div>
                ) : (
                    <div className="profile-request-state">
                        <p className="modal-message warning">No active line manager assignment.</p>
                        <button
                            type="button"
                            className="primary-btn"
                            disabled={acting}
                            onClick={() => handleRequestLM({ isChange: false })}
                        >
                            {acting ? "Requesting..." : "Request LM"}
                        </button>
                    </div>
                )}
            </div>

            {error && <p className="modal-message error">{error}</p>}
            {message && <p className="modal-message">{message}</p>}
        </section>
    );
}

export default Profile;
