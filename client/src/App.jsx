import { useState } from "react";
import EmployeeList from "./components/EmployeeList";
import LMAssignment from "./components/LMAssignment";
import "./styles/main.scss";

function App() {
    const [assignmentRefreshKey, setAssignmentRefreshKey] = useState(0);
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
                <div className="topbar-badge">
                    <span className="status-dot" />
                    Live roster
                </div>
            </header>

            <main className="dashboard-layout">
                <section className="panel panel-main">
                    <EmployeeList onRequestRefresh={triggerAssignmentRefresh} />
                </section>

                <aside className="panel panel-side">
                    <LMAssignment refreshKey={assignmentRefreshKey} onRequestRefresh={triggerAssignmentRefresh} />
                </aside>
            </main>
        </div>
    );
}

export default App;