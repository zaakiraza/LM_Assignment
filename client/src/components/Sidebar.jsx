import { NavLink } from "react-router-dom";

const links = [
    { to: "/add-employee", label: "Import Employees", shortLabel: "I" },
    { to: "/employees", label: "Employees", shortLabel: "E" },
    { to: "/requests", label: "Requests", shortLabel: "R" },
    { to: "/settings", label: "Settings", shortLabel: "S" }
];

function Sidebar({ collapsed, onToggle }) {
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
                            title={collapsed ? link.label : undefined}
                            data-short-label={link.shortLabel}
                    >
                        {!collapsed && link.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}

export default Sidebar;
