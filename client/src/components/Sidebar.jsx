import { NavLink } from "react-router-dom";

const navItems = [
    {
        to: "/add-employee",
        label: "Import Employees",
        shortLabel: "I",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 15V4" />
                <path d="m7 8 5-5 5 5" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
        )
    },
    {
        to: "/employees",
        label: "Employees",
        shortLabel: "E",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        )
    },
    {
        to: "/requests",
        label: "Requests",
        shortLabel: "R",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </svg>
        )
    },
    {
        to: "/settings",
        label: "Settings",
        shortLabel: "S",
        icon: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 21v-6" />
                <path d="M4 9V3" />
                <path d="M12 21v-9" />
                <path d="M12 6V3" />
                <path d="M20 21v-4" />
                <path d="M20 11V3" />
                <path d="M1 15h6" />
                <path d="M9 6h6" />
                <path d="M17 17h6" />
            </svg>
        )
    }
];

function Sidebar({ collapsed, onToggle }) {
    return (
        <aside className={`app-sidebar${collapsed ? " collapsed" : ""}`}>
            <div className="sidebar-brand">
                <div className="brand-mark">LM</div>
                {!collapsed && (
                    <div className="brand-copy">
                        <p className="eyebrow">Operations</p>
                        <h1 className="brand-title">Line Manager Desk</h1>
                    </div>
                )}
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
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                        title={collapsed ? item.label : undefined}
                        data-short-label={item.shortLabel}
                    >
                        <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-foot">Roster workspace</div>
        </aside>
    );
}

export default Sidebar;
