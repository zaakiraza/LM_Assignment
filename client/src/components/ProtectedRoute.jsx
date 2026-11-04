import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowPending = false, requireHR = false, requireLM = false }) {
    const auth = useAuth();

    if (auth.loading) {
        return <div className="panel-state"><h2>Checking session...</h2></div>;
    }

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (auth.isPending && !allowPending) {
        return <Navigate to="/pending" replace />;
    }

    if (requireHR && !auth.isHR) {
        return <Navigate to="/profile" replace />;
    }

    if (requireLM && !auth.isLM && !auth.isHR) {
        return <Navigate to="/profile" replace />;
    }

    return children;
}

export default ProtectedRoute;
