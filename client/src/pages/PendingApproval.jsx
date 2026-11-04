import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PendingApproval() {
    const auth = useAuth();

    if (auth.loading) {
        return <div className="panel-state"><h2>Loading...</h2></div>;
    }

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (auth.isActive) {
        return <Navigate to={auth.isHR ? "/employees" : "/profile"} replace />;
    }

    return (
        <section className="panel panel-main">
            <p className="eyebrow">Access</p>
            <h2>Awaiting HR verification</h2>
            <p>
                Your Google account ({auth.user?.email}) is signed in, but HR has not verified your employee
                profile yet. Once HR sets your position and details, sign in again to access your workspace.
            </p>
            <button type="button" className="secondary-btn" onClick={() => auth.logout()}>
                Sign out
            </button>
        </section>
    );
}

export default PendingApproval;
