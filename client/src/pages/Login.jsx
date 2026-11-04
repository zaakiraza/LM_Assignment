import { GoogleLogin } from "@react-oauth/google";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login() {
    const auth = useAuth();
    const [error, setError] = useState("");

    if (auth.loading) {
        return <div className="panel-state"><h2>Loading...</h2></div>;
    }

    if (auth.isAuthenticated) {
        if (auth.isPending) return <Navigate to="/pending" replace />;
        if (auth.isHR) return <Navigate to="/employees" replace />;
        return <Navigate to="/profile" replace />;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
        return (
            <section className="auth-page">
                <div className="auth-card">
                    <p className="eyebrow">Line Manager Desk</p>
                    <h1>Continue with Google</h1>
                    <p className="auth-copy">Set `VITE_GOOGLE_CLIENT_ID` in the client environment to enable Google sign-in.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="auth-page">
            <div className="auth-card">
                <p className="eyebrow">Line Manager Desk</p>
                <h1>Sign in</h1>
                <p className="auth-copy">
                    Use your Google account. New sign-ins create an unverified employee record until HR completes your profile.
                </p>
                <div className="google-login-wrap">
                    <GoogleLogin
                        onSuccess={async (response) => {
                            try {
                                setError("");
                                const user = await auth.loginWithGoogle(response.credential);
                                if (!user.isVerified) {
                                    window.location.assign("/pending");
                                }
                                else if (user.position === "HR") {
                                    window.location.assign("/employees");
                                }
                                else {
                                    window.location.assign("/profile");
                                }
                            }
                            catch (loginError) {
                                setError(loginError.response?.data?.message || "Google sign-in failed");
                            }
                        }}
                        onError={() => setError("Google sign-in was cancelled or failed")}
                        useOneTap={false}
                    />
                </div>
                {error && <p className="modal-message error">{error}</p>}
            </div>
        </section>
    );
}

export default Login;
