import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import AssignmentService from "../services/assignmentService";
import { useAuth } from "../context/AuthContext";

function Profile() {
    const auth = useAuth();
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

    const handleRequestLM = async () => {
        if (!employee) return;
        try {
            setActing(true);
            setError("");
            setMessage("");
            await AssignmentService.createAssignment(employee.id, null);
            setMessage("LM request sent. HR can see it on the Requests page.");
            await load();
        }
        catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to create LM request");
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
            await load();
        }
        catch (cancelError) {
            setError(cancelError.response?.data?.message || "Failed to cancel LM request");
        }
        finally {
            setActing(false);
        }
    };

    if (loading) return <div className="panel-state"><h2>Loading profile...</h2></div>;
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
                    <div className="detail-row">
                        <span>{assignment.lineManagerName}</span>
                        <strong>{assignment.lineManagerDesignation}</strong>
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
                            onClick={handleRequestLM}
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
