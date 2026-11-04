import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Employees from "./pages/Employees";
import AddEmployees from "./pages/AddEmployees";
import Requests from "./pages/Requests";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import PendingApproval from "./pages/PendingApproval";
import Profile from "./pages/Profile";
import Assignees from "./pages/Assignees";
import PendingUsers from "./pages/PendingUsers";
import FloatingHRChat from "./components/FloatingHRChat";
import { defaultAssignmentCriteria } from "./config/assignmentCriteria";
import SettingsService from "./services/settingsService";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./styles/main.scss";

function AppRoutes() {
    const auth = useAuth();
    const location = useLocation();
    const [assignmentRefreshKey, setAssignmentRefreshKey] = useState(0);
    const [assignmentCriteria, setAssignmentCriteria] = useState(defaultAssignmentCriteria);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const triggerAssignmentRefresh = () => {
        setAssignmentRefreshKey((current) => current + 1);
    };

    useEffect(() => {
        if (!auth.isHR) return;
        SettingsService.getCriteria()
            .then(setAssignmentCriteria)
            .catch(() => setAssignmentCriteria(defaultAssignmentCriteria));
    }, [auth.isHR]);

    const handleSaveCriteria = async (criteria) => {
        const saved = await SettingsService.updateCriteria(criteria);
        setAssignmentCriteria(saved);
    };

    if (auth.loading) {
        return <div className="panel-state"><h2>Loading workspace...</h2></div>;
    }

    const bareRoutes = ["/login", "/pending"];
    const showShell = auth.isAuthenticated && !auth.isPending && !bareRoutes.includes(location.pathname);

    return (
        <div className={`app-shell app-layout${sidebarCollapsed ? " sidebar-collapsed" : ""}${showShell ? "" : " auth-only"}`}>
            {showShell && (
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed((current) => !current)}
                />
            )}
            <main className="app-content">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/pending" element={<PendingApproval />} />

                    <Route path="/profile" element={
                        <ProtectedRoute><Profile /></ProtectedRoute>
                    } />
                    <Route path="/assignees" element={
                        <ProtectedRoute requireLM><Assignees /></ProtectedRoute>
                    } />

                    <Route path="/employees" element={
                        <ProtectedRoute>
                            <Employees criteria={assignmentCriteria} refreshKey={assignmentRefreshKey} onRequestRefresh={triggerAssignmentRefresh} />
                        </ProtectedRoute>
                    } />
                    <Route path="/add-employee" element={
                        <ProtectedRoute requireHR>
                            <AddEmployees onChanged={triggerAssignmentRefresh} />
                        </ProtectedRoute>
                    } />
                    <Route path="/requests" element={
                        <ProtectedRoute requireHR>
                            <Requests criteria={assignmentCriteria} refreshKey={assignmentRefreshKey} onRequestRefresh={triggerAssignmentRefresh} />
                        </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                        <ProtectedRoute requireHR>
                            <Settings criteria={assignmentCriteria} onSave={handleSaveCriteria} />
                        </ProtectedRoute>
                    } />
                    <Route path="/pending-users" element={
                        <ProtectedRoute requireHR><PendingUsers /></ProtectedRoute>
                    } />

                    <Route path="*" element={
                        <Navigate to={
                            !auth.isAuthenticated ? "/login"
                                : auth.isPending ? "/pending"
                                    : auth.isHR ? "/employees"
                                        : "/profile"
                        } replace />
                    } />
                </Routes>
            </main>
            {showShell && auth.isHR && <FloatingHRChat />}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
