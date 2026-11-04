import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const ICONS = {
    dashboard: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M4 4h7v9H4V4Zm2 2v5h3V6H6Zm7-2h7v5h-7V4Zm2 2v1h3V6h-3Zm-2 5h7v9h-7v-9Zm2 2v5h3v-5h-3ZM4 15h7v5H4v-5Zm2 2v1h3v-1H6Z" />
        </svg>
    ),
    employees: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M9 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm8.5-1a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM3.5 19.5c0-2.9 2.4-4.5 5.5-4.5s5.5 1.6 5.5 4.5V20a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-.5Zm11.2-.5c.2-.9.7-1.7 1.4-2.3.9-.7 2.1-1.2 3.4-1.2 2.2 0 3.5 1.1 3.5 3v.5a1 1 0 0 1-1 1h-6.5a1.2 1.2 0 0 1-.8-.5Z" />
        </svg>
    ),
    requests: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M7 3h10a2 2 0 0 1 2 2v14.2a1 1 0 0 1-1.55.84L12 16.7l-5.45 3.34A1 1 0 0 1 5 19.2V5a2 2 0 0 1 2-2Zm0 2v12.4l4.45-2.72a1 1 0 0 1 1.1 0L17 17.4V5H7Z" />
        </svg>
    ),
    verify: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 2.5 19.5 6v5.2c0 4.7-3.1 8.9-7.5 10.3C7.6 20.1 4.5 15.9 4.5 11.2V6L12 2.5Zm0 2.2L6.5 7.1v4.1c0 3.7 2.4 7 5.5 8.2 3.1-1.2 5.5-4.5 5.5-8.2V7.1L12 4.7Zm-.2 4.1a1 1 0 0 1 1.4.05l3 3.2a1 1 0 1 1-1.45 1.35l-2.25-2.4-1.05 1.1a1 1 0 0 1-1.45-1.38l1.8-1.87a1 1 0 0 1 1-.05Z" />
        </svg>
    ),
    settings: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M10.2 2.5h3.6l.4 2.2a6.9 6.9 0 0 1 1.7.98l2.1-.85 1.8 3.12-1.7 1.4c.12.57.2 1.16.2 1.75s-.08 1.18-.2 1.75l1.7 1.4-1.8 3.12-2.1-.85a6.9 6.9 0 0 1-1.7.98l-.4 2.2h-3.6l-.4-2.2a6.9 6.9 0 0 1-1.7-.98l-2.1.85-1.8-3.12 1.7-1.4A7.4 7.4 0 0 1 5.5 12c0-.59.08-1.18.2-1.75l-1.7-1.4 1.8-3.12 2.1.85a6.9 6.9 0 0 1 1.7-.98l.4-2.2ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
        </svg>
    ),
    profile: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.7 0-7 1.8-7 4.2V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1.8C19 15.8 15.7 14 12 14Z" />
        </svg>
    ),
    assignees: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M8 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 1a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM3.8 19.5C3.8 16.9 5.9 15 8 15s4.2 1.9 4.2 4.5V20H3.8v-.5Zm9.7-.5c.2-1.1.7-2 1.4-2.7.8-.7 1.9-1.3 3.1-1.3 2 0 3.2 1.1 3.2 3v.5h-7.7V19Z" />
        </svg>
    ),
    meetings: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M7 3a1 1 0 0 1 1 1v1h8V4a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Zm12 8H5v8h14v-8ZM7 10h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z" />
        </svg>
    ),
    lmFeedback: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 3a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3.1 5.8L17 20l-3.2-1.3A7 7 0 1 1 12 3Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-2.2 3.2 1.5 1.5 3.3-3.4 1.4 1.4-4.7 4.8-2.9-2.9 1.4-1.4Z" />
        </svg>
    ),
    appFeedback: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3.2V16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm2 3v2h12V7H6Zm0 4v2h8v-2H6Z" />
        </svg>
    ),
    logout: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M10 4a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V6H6v12h3v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5Zm4.3 4.3a1 1 0 0 1 1.4 0l3 3a1 1 0 0 1 0 1.4l-3 3a1 1 0 1 1-1.4-1.4L15.58 13H10a1 1 0 1 1 0-2h5.58l-1.28-1.3a1 1 0 0 1 0-1.4Z" />
        </svg>
    )
};

function Sidebar({ collapsed, onToggle }) {
    const auth = useAuth();
    const toast = useToast();

    const handleLogout = async () => {
        if (!window.confirm("Sign out of Line Manager Desk?")) return;
        await auth.logout();
        toast.success("Signed out");
    };

    const sharedLinks = [
        { to: "/lm-meetings", label: "LM Meetings", icon: ICONS.meetings },
        { to: "/lm-feedback", label: "LM Feedback", icon: ICONS.lmFeedback },
        { to: "/app-feedback", label: "App Feedback", icon: ICONS.appFeedback }
    ];

    const links = auth.isHR
        ? [
            { to: "/dashboard", label: "Dashboard", icon: ICONS.dashboard },
            { to: "/employees", label: "Employees", icon: ICONS.employees },
            { to: "/requests", label: "Requests", icon: ICONS.requests },
            { to: "/pending-users", label: "Verify Employees", icon: ICONS.verify },
            ...sharedLinks,
            { to: "/settings", label: "Settings", icon: ICONS.settings },
            { to: "/profile", label: "My Profile", icon: ICONS.profile }
        ]
        : auth.isLM
            ? [
                { to: "/employees", label: "Employees", icon: ICONS.employees },
                { to: "/assignees", label: "Assignees", icon: ICONS.assignees },
                ...sharedLinks,
                { to: "/profile", label: "My Profile", icon: ICONS.profile }
            ]
            : [
                { to: "/employees", label: "Employees", icon: ICONS.employees },
                ...sharedLinks,
                { to: "/profile", label: "My Profile", icon: ICONS.profile }
            ];

    return (
        <aside className={`app-sidebar${collapsed ? " collapsed" : ""}`}>
            <div className="sidebar-brand">
                <div className="brand-mark">LM</div>
                {!collapsed && <div>
                    <p className="eyebrow">Operations</p>
                    <h1 className="brand-title">Line Manager Desk</h1>
                </div>}
                <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={onToggle}
                    aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
                    title={collapsed ? "Open sidebar" : "Close sidebar"}
                >
                    {collapsed ? "›" : "‹"}
                </button>
            </div>
            <nav className="sidebar-nav" aria-label="Main navigation">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                        title={link.label}
                    >
                        <span className="sidebar-link-icon">{link.icon}</span>
                        {!collapsed && <span className="sidebar-link-label">{link.label}</span>}
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-footer">
                <button
                    type="button"
                    className="secondary-btn small-btn full sidebar-logout"
                    onClick={handleLogout}
                    title="Sign out"
                >
                    <span className="sidebar-link-icon">{ICONS.logout}</span>
                    {!collapsed && <span>Sign out</span>}
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
