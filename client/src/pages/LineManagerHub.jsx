import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AssignmentService from "../services/assignmentService";
import LoadingSpinner from "../components/LoadingSpinner";
import MyLineManager from "../components/MyLineManager";
import LMMeetings from "./LMMeetings";
import LMFeedback from "./LMFeedback";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function LineManagerHub() {
    const auth = useAuth();
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [assignment, setAssignment] = useState(null);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);

    // Everyone (HR included) can have a line manager; HR's Meetings/Feedback tabs show all records.
    const tabs = [
        { key: "overview", label: "My line manager" },
        { key: "meetings", label: auth.isHR ? "All meetings" : "Meetings" },
        { key: "feedback", label: auth.isHR ? "All feedback" : "Feedback" }
    ];
    const requested = searchParams.get("tab");
    const activeTab = tabs.some((tab) => tab.key === requested) ? requested : tabs[0].key;

    const userId = auth.user?.id;

    const loadAssignment = useCallback(async () => {
        if (!userId) return;
        try {
            const [current, pending] = await Promise.all([
                AssignmentService.getEmployeeAssignment(userId),
                AssignmentService.getMyPendingAssignment()
            ]);
            setAssignment(current);
            setPendingRequest(pending);
        }
        catch (error) {
            toast.error(error.response?.data?.message || "Failed to load line manager details");
        }
        finally {
            setLoading(false);
        }
    }, [userId, toast]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAssignment();
    }, [loadAssignment]);

    const handleRequestChange = async () => {
        if (!window.confirm("Request a change of line manager? HR will review it on the Requests page.")) return;
        try {
            setActing(true);
            await AssignmentService.createAssignment(auth.user.id, null);
            toast.success("Change LM request sent. HR can see it on the Requests page.");
            await loadAssignment();
        }
        catch (error) {
            toast.error(error.response?.data?.message || "Failed to request a line manager change");
        }
        finally {
            setActing(false);
        }
    };

    const handleUndoRequest = async () => {
        if (!pendingRequest) return;
        if (!window.confirm("Cancel your pending LM change request?")) return;
        try {
            setActing(true);
            await AssignmentService.cancelPendingAssignment(pendingRequest.assignmentId);
            toast.success("LM change request cancelled");
            await loadAssignment();
        }
        catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel LM change request");
        }
        finally {
            setActing(false);
        }
    };

    const description = auth.isHR
        ? "Your own line manager, plus all 1:1 meetings and line manager feedback across the organisation."
        : auth.isLM
            ? "Your own line manager, plus meetings and feedback with your team."
            : "Everything about your line manager in one place: details, 1:1 meetings and feedback.";

    return (
        <section className="panel panel-main feature-page lm-hub">
            <div className="section-header">
                <div className="section-heading-block">
                    <p className="eyebrow">Line manager</p>
                    <h2>{auth.isHR ? "Line manager hub" : "My line manager"}</h2>
                    <p className="page-description">{description}</p>
                </div>
            </div>

            <div className="page-tabs" role="tablist" aria-label="Line manager sections">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.key}
                        className={`page-tab${activeTab === tab.key ? " active" : ""}`}
                        onClick={() => setSearchParams({ tab: tab.key }, { replace: true })}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="page-tab-panel" role="tabpanel">
                {loading ? (
                    <LoadingSpinner label="Loading line manager..." />
                ) : activeTab === "overview" ? (
                    <MyLineManager
                        assignment={assignment}
                        pendingRequest={pendingRequest}
                        acting={acting}
                        onRequestChange={handleRequestChange}
                        onUndoRequest={handleUndoRequest}
                    />
                ) : activeTab === "meetings" ? (
                    <LMMeetings embedded />
                ) : (
                    <LMFeedback embedded canSubmit={Boolean(assignment)} />
                )}
            </div>
        </section>
    );
}

export default LineManagerHub;
