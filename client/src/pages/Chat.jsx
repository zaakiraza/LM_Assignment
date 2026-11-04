import { useEffect, useRef, useState } from "react";
import ChatService from "../services/chatService";

const SUGGESTIONS = [
    "How many employees are there?",
    "How many employees are without a line manager?",
    "How many pending LM requests are there?",
    "List line managers and their assignee counts"
];

function Chat() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const threadRef = useRef(null);

    useEffect(() => {
        if (!threadRef.current) return;
        threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, [messages, loading, error]);

    const ask = async (question) => {
        const text = question.trim();
        if (!text || loading) return;

        setMessage("");
        setError("");
        setMessages((current) => [...current, { role: "user", text }]);

        try {
            setLoading(true);
            const result = await ChatService.ask(text);
            setMessages((current) => [...current, { role: "assistant", text: result.answer }]);
        }
        catch (askError) {
            const errorText = askError.response?.data?.message || "Failed to get an answer";
            setError(errorText);
            setMessages((current) => [...current, { role: "assistant", text: errorText, isError: true }]);
        }
        finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        await ask(message);
    };

    return (
        <section className="panel panel-main chat-page">
            <p className="eyebrow">HR assistant</p>
            <div className="section-header">
                <div>
                    <h2>Workforce chat</h2>
                    <p>Ask about headcount, people without an LM, pending requests, and manager load.</p>
                </div>
            </div>

            <div className="chat-shell">
                <div className="chat-thread" ref={threadRef}>
                    {messages.length === 0 && !loading && (
                        <div className="chat-empty">
                            <p>Ask a workforce question, or start with one of these:</p>
                            <div className="chat-suggestions">
                                {SUGGESTIONS.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        className="chat-suggestion"
                                        onClick={() => ask(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((item, index) => (
                        <div
                            key={`${item.role}-${index}`}
                            className={`chat-bubble ${item.role}${item.isError ? " error" : ""}`}
                        >
                            <span className="meta-label">{item.role === "user" ? "You" : "Assistant"}</span>
                            <p>{item.text}</p>
                        </div>
                    ))}

                    {loading && (
                        <div className="chat-bubble assistant typing">
                            <span className="meta-label">Assistant</span>
                            <p>Thinking...</p>
                        </div>
                    )}
                </div>

                <form className="chat-compose" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Ask about workforce data..."
                        disabled={loading}
                    />
                    <button type="submit" className="primary-btn" disabled={loading || !message.trim()}>
                        {loading ? "Thinking..." : "Ask"}
                    </button>
                </form>
            </div>
        </section>
    );
}

export default Chat;
