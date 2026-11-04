import { useEffect, useState } from "react";
import FeedbackService from "../services/feedbackService";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../context/ToastContext";

function LMFeedback() {
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
            const data = await FeedbackService.list("lm");
            setRows(data);
        }
        catch (loadError) {
            setError(loadError.response?.data?.message || "Failed to load LM feedback");
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
                type: "lm",
                rating: Number(form.rating),
                message: form.message
            });
            toast.success("LM feedback submitted");
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

    if (loading) return <LoadingSpinner label="Loading LM feedback..." />;

    return (
        <section className="panel panel-main feature-page">
            <p className="eyebrow">Feedback</p>
            <div className="section-header">
                <div className="section-heading-block">
                    <h2>LM feedback</h2>
                    <p className="page-description">
                        Share feedback about your line manager. HR and your LM can review submitted notes.
                    </p>
                </div>
                <span className="counter-pill">{rows.length}</span>
            </div>

            {error && <p className="modal-message error">{error}</p>}

            <form className="feature-form" onSubmit={handleSubmit}>
                <h3>Submit LM feedback</h3>
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
                            placeholder="What went well? What could improve?"
                            required
                        />
                    </div>
                </div>
                <div className="modal-actions">
                    <button type="submit" className="primary-btn" disabled={saving || !form.message.trim()}>
                        {saving ? "Submitting..." : "Submit feedback"}
                    </button>
                </div>
            </form>

            {rows.length === 0 ? (
                <div className="empty-state requests-empty">
                    <div className="empty-illustration" aria-hidden="true">★</div>
                    <h3>No LM feedback yet</h3>
                    <p>Submitted line-manager feedback will show up here.</p>
                </div>
            ) : (
                <div className="feature-list">
                    {rows.map((item) => (
                        <article key={item.id} className="feature-card">
                            <div className="feature-card-head">
                                <div>
                                    <h3>{item.fromEmployee?.name || "Employee"}</h3>
                                    <p>
                                        To {item.toEmployee?.name || "LM"}
                                        {item.rating ? ` · ${item.rating}/5` : ""}
                                    </p>
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

export default LMFeedback;
