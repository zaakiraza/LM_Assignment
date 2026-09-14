import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Employees from "./pages/Employees";
import AddEmployees from "./pages/AddEmployees";
import Requests from "./pages/Requests";
import Settings from "./pages/Settings";
import { defaultAssignmentCriteria } from "./config/assignmentCriteria";
import "./styles/main.scss";

function App() {
    const [assignmentRefreshKey, setAssignmentRefreshKey] = useState(0);
    const [assignmentCriteria, setAssignmentCriteria] = useState(defaultAssignmentCriteria);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const triggerAssignmentRefresh = () => {
        setAssignmentRefreshKey((current) => current + 1);
    };

    return (
        <BrowserRouter>
            <div className={`app-shell app-layout${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
                <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((current) => !current)} />
                <main className="app-content">
                    <div className="topbar-badge app-status">
                        <span className="status-dot" />
                        Live roster
                    </div>
                    <Routes>
                        <Route path="/employees" element={<Employees criteria={assignmentCriteria} refreshKey={assignmentRefreshKey} onRequestRefresh={triggerAssignmentRefresh} />} />
                        <Route path="/add-employee" element={<AddEmployees onChanged={triggerAssignmentRefresh} />} />
                        <Route path="/requests" element={<Requests criteria={assignmentCriteria} refreshKey={assignmentRefreshKey} onRequestRefresh={triggerAssignmentRefresh} />} />
                        <Route path="/settings" element={<Settings criteria={assignmentCriteria} onSave={setAssignmentCriteria} />} />
                        <Route path="*" element={<Navigate to="/employees" replace />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
