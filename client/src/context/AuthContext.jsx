import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AuthService from "../services/authService";
import { isHR, isLMCapable } from "../config/positions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        const token = localStorage.getItem("lm_token");
        if (!token) {
            setUser(null);
            setLoading(false);
            return null;
        }

        try {
            const nextUser = await AuthService.me();
            setUser(nextUser);
            return nextUser;
        }
        catch {
            localStorage.removeItem("lm_token");
            setUser(null);
            return null;
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const loginWithGoogle = async (credential) => {
        const data = await AuthService.googleLogin(credential);
        localStorage.setItem("lm_token", data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        await AuthService.logout();
        localStorage.removeItem("lm_token");
        setUser(null);
    };

    const value = useMemo(() => {
        const position = user?.isVerified ? (user.position || null) : null;
        return {
            user,
            loading,
            position,
            isAuthenticated: Boolean(user),
            isPending: Boolean(user) && !user.isVerified,
            isActive: Boolean(user?.isVerified),
            isHR: isHR(position),
            isLM: isLMCapable(position),
            loginWithGoogle,
            logout,
            refreshUser
        };
    }, [user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}
