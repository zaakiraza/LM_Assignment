import { useEffect, useState } from "react";
import FeedbackService from "../services/feedbackService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function AppFeedback() {
    const auth = useAuth();
    const toast = useToast();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ rating: "5", message: "" });

    const load = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await FeedbackService.list("app");
            setRows(data);
        }
        catch (loadError) {
            setError(loadError.response?.data?.message || "Failed to load app feedback");
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            await FeedbackService.create({
                type: "app",
                rating: Number(form.rating),
                message: form.message
            });
            toast.success("Thanks for the feedback");
            setForm({ rating: "5", message: "" });
            await load();
        }
        catch (saveError) {
            toast.error(saveError.response?.data?.message || "Failed to submit feedback");
        }
        finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner label="Loading feedback..." />;

    return (
        <section className="panel panel-main feature-page">
            <p className="eyebrow">Product</p>
            <div className="section-header">
                <div className="section-heading-block">
                    <h2>App feedback for developers</h2>
                    <p className="page-description">
                        Send general feedback about the app — bugs, ideas, or UX issues for the development team.
                    </p>
                </div>
                <span className="counter-pill">{rows.length}</span>
            </div>

            {error && <p className="modal-message error">{error}</p>}

            <form className="feature-form" onSubmit={handleSubmit}>
                <h3>Send feedback</h3>
                <div className="modal-form-grid">
                    <div className="form-field">
                        <label className="field-label">Rating</label>
                        <select
                            className="modal-input"
                            value={form.rating}
                            onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
                        >
                            {[5, 4, 3, 2, 1].map((value) => (
                                <option key={value} value={value}>{value} / 5</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field form-span-2">
                        <label className="field-label">Message</label>
                        <textarea
                            className="modal-input feature-textarea"
                            rows={4}
                            value={form.message}
                            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                            placeholder="Describe the issue or suggestion..."
                            required
                        />
                    </div>
                </div>
                <div className="modal-actions">
                    <button type="submit" className="primary-btn" disabled={saving || !form.message.trim()}>
                        {saving ? "Sending..." : "Send to developers"}
                    </button>
                </div>
            </form>

            <h3 className="feature-list-title">
                {auth.isHR ? "All app feedback" : "Your submitted feedback"}
            </h3>

            {rows.length === 0 ? (
                <div className="empty-state requests-empty">
                    <div className="empty-illustration" aria-hidden="true">💬</div>
                    <h3>No app feedback yet</h3>
                    <p>Developer feedback entries will appear here.</p>
                </div>
            ) : (
                <div className="feature-list">
                    {rows.map((item) => (
                        <article key={item.id} className="feature-card">
                            <div className="feature-card-head">
                                <div>
                                    <h3>{item.fromEmployee?.name || "User"}</h3>
                                    <p>{item.rating ? `${item.rating}/5` : "No rating"}</p>
                                </div>
                                <span className="meta-label">
                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                                </span>
                            </div>
                            <p className="feature-notes">{item.message}</p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default AppFeedback;
