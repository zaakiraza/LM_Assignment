import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmployeeService from "../services/employeeService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

function Profile() {
    const auth = useAuth();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setEmployee(await EmployeeService.getMyProfile());
        }
        catch (loadError) {
            setError(loadError.response?.data?.message || "Failed to load profile");
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    if (loading) return <LoadingSpinner label="Loading profile..." />;
    if (error && !employee) return <div className="panel-state error"><h2>{error}</h2></div>;
    if (!employee) return null;

    return (
        <section className="panel panel-main feature-page">
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

            <Link to="/line-manager" className="lm-change-box lm-link-card">
                <div>
                    <h3>Line manager</h3>
                    <p>See your line manager, request a change, and manage your 1:1 meetings and feedback.</p>
                </div>
                <span className="secondary-btn">Open →</span>
            </Link>
        </section>
    );
}

export default Profile;
