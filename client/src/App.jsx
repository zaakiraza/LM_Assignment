import { useState } from "react";
import EmployeeList from "./components/EmployeeList";
import LMAssignment from "./components/LMAssignment";
import AssignmentCriteriaModal from "./components/AssignmentCriteriaModal";
import { defaultAssignmentCriteria } from "./config/assignmentCriteria";
import "./styles/main.scss";

function App() {
    const [assignmentRefreshKey, setAssignmentRefreshKey] = useState(0);
    const [assignmentCriteria, setAssignmentCriteria] = useState(defaultAssignmentCriteria);
    const [showCriteria, setShowCriteria] = useState(false);
    const triggerAssignmentRefresh = () => {
        setAssignmentRefreshKey((current) => current + 1);
    };

    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="brand-block">
                    <div className="brand-mark">LM</div>
                    <div>
                        <p className="eyebrow">Operations</p>
                        <h1 className="brand-title">Line Manager Desk</h1>
                    </div>
                </div>
                <div className="topbar-actions">
                    <div className="topbar-badge">
                        <span className="status-dot" />
                        Live roster
                    </div>
                    <button type="button" className="primary-btn settings-btn" onClick={() => setShowCriteria(true)}>
                        Assignment settings
                    </button>
                </div>
            </header>

            {showCriteria && (
                <AssignmentCriteriaModal
                    criteria={assignmentCriteria}
                    onClose={() => setShowCriteria(false)}
                    onSave={(criteria) => {
                        setAssignmentCriteria(criteria);
                        setShowCriteria(false);
                    }}
                />
            )}

            <main className="dashboard-layout">
                <section className="panel panel-main">
                    <EmployeeList
                        refreshKey={assignmentRefreshKey}
                        criteria={assignmentCriteria}
                        onRequestRefresh={triggerAssignmentRefresh}
                    />
                </section>

                <aside className="panel panel-side">
                    <LMAssignment
                        refreshKey={assignmentRefreshKey}
                        criteria={assignmentCriteria}
                        onRequestRefresh={triggerAssignmentRefresh}
                    />
                </aside>
            </main>
        </div>
    );
}

export default App;