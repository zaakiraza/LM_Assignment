import { useEffect, useState } from "react";
import EmployeeService from "../services/employeeService";
import { useAuth } from "../context/AuthContext";

function Assignees() {
    const auth = useAuth();
    const [assignees, setAssignees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await EmployeeService.getMyAssignees();
                setAssignees(data);
            }
            catch (loadError) {
                setError(loadError.response?.data?.message || "Failed to load assignees");
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="panel-state"><h2>Loading assignees...</h2></div>;
    if (error) return <div className="panel-state error"><h2>{error}</h2></div>;

    return (
        <section className="panel panel-main">
            <p className="eyebrow">Line manager</p>
            <div className="section-header">
                <div>
                    <h2>My assignees</h2>
                    <p>{auth.position}</p>
                </div>
                <span className="counter-pill">{assignees.length}</span>
            </div>

            {assignees.length === 0 ? (
                <div className="empty-state">
                    <p>No employees are assigned to you yet.</p>
                </div>
            ) : (
                <div className="assignee-list page-assignee-list">
                    {assignees.map((employee) => (
                        <div key={employee.id} className="assignee-row">
                            <div>
                                <strong>{employee.name}</strong>
                                <p>{employee.department}</p>
                            </div>
                            <strong>{employee.position}</strong>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export default Assignees;
