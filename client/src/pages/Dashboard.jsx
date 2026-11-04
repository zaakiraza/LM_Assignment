import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardService from "../services/dashboardService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";

const numberFormat = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const formatNumber = (value) => numberFormat.format(value ?? 0);
const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

const TILE_ICONS = {
    people: "M9 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm8.5-1a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM3.5 19.5c0-2.9 2.4-4.5 5.5-4.5s5.5 1.6 5.5 4.5V20a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-.5Zm11.2-.5c.2-.9.7-1.7 1.4-2.3.9-.7 2.1-1.2 3.4-1.2 2.2 0 3.5 1.1 3.5 3v.5a1 1 0 0 1-1 1h-6.5a1.2 1.2 0 0 1-.8-.5Z",
    manager: "M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13c-2-.8-3.7-2.3-4.7-4.2.9-1.3 2.8-2.3 4.7-2.3s3.8 1 4.7 2.3c-1 1.9-2.7 3.4-4.7 4.2Z",
    link: "M10.6 13.4a1 1 0 0 1 0-1.4l3-3a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 1-1.4 0ZM8 17.5a3.5 3.5 0 0 1-2.5-6l2-2a1 1 0 1 1 1.4 1.4l-2 2a1.5 1.5 0 0 0 2.1 2.1l2-2a1 1 0 1 1 1.4 1.4l-2 2A3.5 3.5 0 0 1 8 17.5Zm7.1-2.9a1 1 0 0 1 0-1.4l2-2A1.5 1.5 0 0 0 15 9.1l-2 2a1 1 0 1 1-1.4-1.4l2-2a3.5 3.5 0 1 1 5 5l-2 2a1 1 0 0 1-1.5-.1Z",
    alert: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 4a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm0 8.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z",
    inbox: "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 9v5h14v-5h-3.3a3.9 3.9 0 0 1-7.4 0H5Zm0-2h5a1 1 0 0 1 1 1 1 1 0 0 0 2 0 1 1 0 0 1 1-1h5V6H5v5Z",
    shield: "M12 2.5 19.5 6v5.2c0 4.7-3.1 8.9-7.5 10.3C7.6 20.1 4.5 15.9 4.5 11.2V6L12 2.5Zm3.2 6.8a1 1 0 0 0-1.4 0L11 12.1l-1.3-1.3a1 1 0 1 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l3.5-3.5a1 1 0 0 0 0-1.4Z"
};

function Icon({ name }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d={TILE_ICONS[name]} />
        </svg>
    );
}

function StatTile({ label, value, hint, icon, tone = "primary", to }) {
    const body = (
        <>
            <span className={`stat-tile-icon tone-${tone}`}><Icon name={icon} /></span>
            <div className="stat-tile-copy">
                <span className="stat-tile-label">{label}</span>
                <strong className="stat-tile-value">{formatNumber(value)}</strong>
                {hint && <span className="stat-tile-hint">{hint}</span>}
            </div>
        </>
    );
    return to
        ? <Link to={to} className="stat-tile stat-tile-link">{body}</Link>
        : <div className="stat-tile">{body}</div>;
}

/** Shared hover tooltip for every chart card. */
function useTooltip() {
    const [tip, setTip] = useState(null);
    const show = (event, content) => {
        const host = event.currentTarget.closest(".dash-card");
        if (!host) return;
        const hostRect = host.getBoundingClientRect();
        const rect = event.currentTarget.getBoundingClientRect();
        setTip({
            content,
            left: Math.min(rect.left - hostRect.left + rect.width / 2, hostRect.width - 90),
            top: rect.top - hostRect.top
        });
    };
    const hide = () => setTip(null);
    const node = tip ? (
        <div className="chart-tooltip" style={{ left: Math.max(90, tip.left), top: tip.top }} role="tooltip">
            {tip.content}
        </div>
    ) : null;
    return { show, hide, node };
}

function TooltipRows({ title, rows }) {
    return (
        <>
            <strong>{title}</strong>
            {rows.map((row) => (
                <span key={row.label} className="chart-tooltip-row">
                    {row.swatch && <i className={`legend-swatch ${row.swatch}`} />}
                    {row.label}<b>{row.value}</b>
                </span>
            ))}
        </>
    );
}

function CoverageCard({ coverage, workforce }) {
    const tooltip = useTooltip();
    const parts = [
        { key: "assigned", label: "Assigned", value: coverage.assigned, swatch: "series-1" },
        { key: "pending", label: "Request pending", value: coverage.pending, swatch: "series-2" },
        { key: "unassigned", label: "No LM", value: coverage.unassigned, swatch: "series-neutral" }
    ];
    const assignedShare = percent(coverage.assigned, workforce);

    return (
        <section className="dash-card">
            <header className="dash-card-head">
                <div>
                    <h3>LM coverage</h3>
                    <p>Employees (excluding HR) with an active line manager</p>
                </div>
            </header>
            <div className="coverage-hero">
                <strong>{assignedShare}%</strong>
                <span>{coverage.assigned} of {workforce} employees assigned</span>
            </div>
            {workforce > 0 ? (
                <div
                    className="segmented-bar"
                    role="img"
                    aria-label={parts.map((part) => `${part.label}: ${part.value}`).join(", ")}
                >
                    {parts.filter((part) => part.value > 0).map((part) => (
                        <span
                            key={part.key}
                            className={`segment ${part.swatch}`}
                            style={{ flexGrow: part.value }}
                            tabIndex={0}
                            onMouseEnter={(event) => tooltip.show(event, (
                                <TooltipRows title={part.label} rows={[
                                    { label: "Employees", value: part.value },
                                    { label: "Share", value: `${percent(part.value, workforce)}%` }
                                ]} />
                            ))}
                            onFocus={(event) => tooltip.show(event, (
                                <TooltipRows title={part.label} rows={[{ label: "Employees", value: part.value }]} />
                            ))}
                            onMouseLeave={tooltip.hide}
                            onBlur={tooltip.hide}
                        />
                    ))}
                </div>
            ) : (
                <p className="dash-empty">No verified employees yet.</p>
            )}
            <ul className="chart-legend">
                {parts.map((part) => (
                    <li key={part.key}>
                        <i className={`legend-swatch ${part.swatch}`} />
                        {part.label}
                        <b>{part.value}</b>
                    </li>
                ))}
            </ul>
            {tooltip.node}
        </section>
    );
}

function DepartmentCard({ rows }) {
    const tooltip = useTooltip();
    const max = Math.max(1, ...rows.map((row) => row.total));

    return (
        <section className="dash-card">
            <header className="dash-card-head">
                <div>
                    <h3>Employees by department</h3>
                    <p>Assigned vs. without a line manager</p>
                </div>
                <ul className="chart-legend inline">
                    <li><i className="legend-swatch series-1" />Assigned</li>
                    <li><i className="legend-swatch series-neutral" />No LM</li>
                </ul>
            </header>
            {rows.length === 0 ? <p className="dash-empty">No departments yet.</p> : (
                <div className="bar-list">
                    {rows.map((row) => (
                        <div
                            key={row.department}
                            className="bar-row"
                            tabIndex={0}
                            onMouseEnter={(event) => tooltip.show(event, (
                                <TooltipRows title={row.department} rows={[
                                    { label: "Assigned", value: row.assigned, swatch: "series-1" },
                                    { label: "No LM", value: row.unassigned, swatch: "series-neutral" },
                                    { label: "Total", value: row.total }
                                ]} />
                            ))}
                            onFocus={(event) => tooltip.show(event, (
                                <TooltipRows title={row.department} rows={[
                                    { label: "Assigned", value: row.assigned },
                                    { label: "No LM", value: row.unassigned }
                                ]} />
                            ))}
                            onMouseLeave={tooltip.hide}
                            onBlur={tooltip.hide}
                        >
                            <span className="bar-label">{row.department}</span>
                            <div className="bar-track">
                                <div className="bar-stack" style={{ width: `${(row.total / max) * 100}%` }}>
                                    {row.assigned > 0 && <span className="bar-fill series-1" style={{ flexGrow: row.assigned }} />}
                                    {row.unassigned > 0 && <span className="bar-fill series-neutral" style={{ flexGrow: row.unassigned }} />}
                                </div>
                            </div>
                            <span className="bar-value">{row.total}</span>
                        </div>
                    ))}
                </div>
            )}
            {tooltip.node}
        </section>
    );
}

function CapacityCard({ managers, capacity }) {
    const utilisation = percent(capacity.usedSlots, capacity.totalSlots);
    return (
        <section className="dash-card">
            <header className="dash-card-head">
                <div>
                    <h3>Line manager capacity</h3>
                    <p>Up to {capacity.perManager} employees each · {utilisation}% of {capacity.totalSlots} slots used</p>
                </div>
                <Link to="/settings" className="text-btn">Edit limit</Link>
            </header>
            {managers.length === 0 ? <p className="dash-empty">No line managers yet.</p> : (
                <ul className="capacity-list">
                    {managers.map((manager) => {
                        const share = percent(manager.managed, manager.capacity);
                        const state = share >= 100 ? "danger" : share >= 75 ? "warning" : "ok";
                        return (
                            <li key={manager.id} className="capacity-row">
                                <span className="lm-avatar small">{manager.name.slice(0, 1).toUpperCase()}</span>
                                <div className="capacity-copy">
                                    <div className="capacity-top">
                                        <strong>{manager.name}</strong>
                                        <span className={`capacity-count ${state}`}>
                                            {state === "danger" && <span aria-hidden="true">●</span>}
                                            {manager.managed}/{manager.capacity}
                                            {state === "danger" && " full"}
                                        </span>
                                    </div>
                                    <span className="capacity-meta">{manager.position} · {manager.department}</span>
                                    <div
                                        className={`meter ${state}`}
                                        role="meter"
                                        aria-valuemin={0}
                                        aria-valuemax={manager.capacity}
                                        aria-valuenow={manager.managed}
                                        aria-label={`${manager.name} manages ${manager.managed} of ${manager.capacity}`}
                                    >
                                        <span style={{ width: `${Math.min(100, share)}%` }} />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

function PositionCard({ rows }) {
    const tooltip = useTooltip();
    const max = Math.max(1, ...rows.map((row) => row.count));
    return (
        <section className="dash-card">
            <header className="dash-card-head">
                <div>
                    <h3>Headcount by position</h3>
                    <p>Verified employees</p>
                </div>
            </header>
            <div className="bar-list">
                {rows.map((row) => (
                    <div
                        key={row.position}
                        className="bar-row"
                        tabIndex={0}
                        onMouseEnter={(event) => tooltip.show(event, (
                            <TooltipRows title={row.position} rows={[{ label: "Employees", value: row.count }]} />
                        ))}
                        onFocus={(event) => tooltip.show(event, (
                            <TooltipRows title={row.position} rows={[{ label: "Employees", value: row.count }]} />
                        ))}
                        onMouseLeave={tooltip.hide}
                        onBlur={tooltip.hide}
                    >
                        <span className="bar-label">{row.position}</span>
                        <div className="bar-track">
                            {row.count > 0 && (
                                <div className="bar-stack" style={{ width: `${(row.count / max) * 100}%` }}>
                                    <span className="bar-fill series-1" style={{ flexGrow: 1 }} />
                                </div>
                            )}
                        </div>
                        <span className="bar-value">{row.count}</span>
                    </div>
                ))}
            </div>
            {tooltip.node}
        </section>
    );
}

function ActivityCard({ engagement, recent }) {
    return (
        <section className="dash-card">
            <header className="dash-card-head">
                <div>
                    <h3>Engagement</h3>
                    <p>Meetings, feedback and the latest assignments</p>
                </div>
            </header>
            <div className="mini-stats">
                <Link to="/lm-meetings" className="mini-stat">
                    <span>Upcoming meetings</span>
                    <strong>{engagement.upcomingMeetings}</strong>
                </Link>
                <Link to="/lm-meetings" className="mini-stat">
                    <span>Meetings this month</span>
                    <strong>{engagement.meetingsThisMonth}</strong>
                </Link>
                <Link to="/lm-feedback" className="mini-stat">
                    <span>Avg. LM rating</span>
                    <strong>{engagement.averageLmRating ?? "—"}{engagement.averageLmRating ? <small> / 5</small> : null}</strong>
                </Link>
                <Link to="/app-feedback" className="mini-stat">
                    <span>App feedback</span>
                    <strong>{engagement.appFeedbackCount}</strong>
                </Link>
            </div>
            <h4 className="dash-subtitle">Recently assigned</h4>
            {recent.length === 0 ? <p className="dash-empty">No active assignments yet.</p> : (
                <ul className="activity-list">
                    {recent.map((item) => (
                        <li key={item.id}>
                            <span className="activity-dot" aria-hidden="true" />
                            <div>
                                <strong>{item.employeeName}</strong>
                                <span> → {item.lineManagerName}</span>
                            </div>
                            <time dateTime={item.assignedAt}>
                                {new Date(item.assignedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </time>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function Dashboard() {
    const auth = useAuth();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            setRefreshing(true);
            setError("");
            setStats(await DashboardService.getStats());
        }
        catch (loadError) {
            setError(loadError.response?.data?.message || "Failed to load dashboard");
        }
        finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const firstName = (auth.user?.name || "").split(" ")[0];

    return (
        <section className="panel panel-main dashboard-page">
            <div className="section-header">
                <div className="section-heading-block">
                    <p className="eyebrow">Overview</p>
                    <h2>{firstName ? `Welcome back, ${firstName}` : "Dashboard"}</h2>
                    <p className="page-description">A live snapshot of your workforce and line manager assignments.</p>
                </div>
                <button type="button" className="secondary-btn" onClick={load} disabled={refreshing}>
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {error && <p className="modal-message error">{error}</p>}

            {!stats ? (
                !error && <LoadingSpinner label="Loading dashboard..." />
            ) : (
                <>
                    <div className="stat-grid">
                        <StatTile label="Total employees" value={stats.totals.employees} icon="people"
                            hint={`${stats.totals.departments} departments`} to="/employees" />
                        <StatTile label="Line managers" value={stats.totals.lineManagers} icon="manager" tone="violet"
                            hint={`${stats.capacity.availableSlots} open slots`} />
                        <StatTile label="Assigned to an LM" value={stats.totals.assigned} icon="link" tone="success"
                            hint={`${percent(stats.totals.assigned, stats.totals.workforce)}% coverage`} />
                        <StatTile label="Without an LM" value={stats.totals.withoutLM} icon="alert" tone="warning"
                            hint="Excludes HR" to="/employees" />
                        <StatTile label="Pending requests" value={stats.totals.pendingRequests} icon="inbox" tone="info"
                            hint="Awaiting HR decision" to="/requests" />
                        <StatTile label="Awaiting verification" value={stats.totals.awaitingVerification} icon="shield" tone="danger"
                            hint="New Google sign-ins" to="/pending-users" />
                    </div>

                    <div className="dash-grid">
                        <CoverageCard coverage={stats.coverage} workforce={stats.totals.workforce} />
                        <DepartmentCard rows={stats.byDepartment} />
                        <CapacityCard managers={stats.lineManagers} capacity={stats.capacity} />
                        <ActivityCard engagement={stats.engagement} recent={stats.recentAssignments} />
                        <PositionCard rows={stats.byPosition} />
                    </div>
                </>
            )}
        </section>
    );
}

export default Dashboard;
