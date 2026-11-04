import { useEffect, useRef, useState } from "react";
import ChatService from "../services/chatService";

const SUGGESTIONS = [
    "How many employees are there?",
    "How many employees are without a line manager?",
    "How many pending LM requests are there?",
    "List line managers and their assignee counts"
];

const AVATARS = [
    {
        id: "bot",
        label: "Bot",
        color: "#1f6f5b",
        glyph: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 2a1 1 0 0 1 1 1v1.06A7 7 0 0 1 19 11v2a3 3 0 0 1-3 3h-1.1l-.45 1.8A2 2 0 0 1 12.5 19h-1a2 2 0 0 1-1.95-1.5L9.1 16H8a3 3 0 0 1-3-3v-2a7 7 0 0 1 6-6.94V3a1 1 0 0 1 1-1Zm-3.5 10.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm7 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
            </svg>
        )
    },
    {
        id: "spark",
        label: "Spark",
        color: "#2f6b3a",
        glyph: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 2.2 13.7 8.3 19.8 10 13.7 11.7 12 17.8 10.3 11.7 4.2 10 10.3 8.3 12 2.2Zm6.5 10.3 1 3.4 3.4 1-3.4 1-1 3.4-1-3.4-3.4-1 3.4-1 1-3.4ZM5.5 14.5l.75 2.5 2.5.75-2.5.75-.75 2.5-.75-2.5-2.5-.75 2.5-.75.75-2.5Z" />
            </svg>
        )
    },
    {
        id: "headset",
        label: "Support",
        color: "#245b73",
        glyph: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 3a8 8 0 0 0-8 8v5a3 3 0 0 0 3 3h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H6.1A6 6 0 0 1 12 5a6 6 0 0 1 5.9 5H16a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1a3 3 0 0 0 2.83-2H20a1 1 0 0 0 1-1v-1a8 8 0 0 0-9-8Z" />
            </svg>
        )
    },
    {
        id: "briefcase",
        label: "HR",
        color: "#5a4a2f",
        glyph: (
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M9 3h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H2V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm1 3h4V5h-4v1Zm12 7v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5h8v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h8Z" />
            </svg>
        )
    }
];

const AVATAR_STORAGE_KEY = "hr-chat-avatar-id";
const AVATAR_SIZE = 58;
const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 480;

/** Space kept free at the bottom for the mobile tab bar. */
function bottomReserve() {
    return typeof window !== "undefined" && window.innerWidth <= 768 ? 84 : 0;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getStoredAvatarId() {
    try {
        const saved = localStorage.getItem(AVATAR_STORAGE_KEY);
        if (AVATARS.some((avatar) => avatar.id === saved)) return saved;
    }
    catch {
        // ignore storage errors
    }
    return AVATARS[0].id;
}

function FloatingHRChat() {
    const [open, setOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [avatarId, setAvatarId] = useState(getStoredAvatarId);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [position, setPosition] = useState(() => ({
        x: typeof window !== "undefined" ? window.innerWidth - 92 : 24,
        y: typeof window !== "undefined" ? window.innerHeight - 96 - bottomReserve() : 24
    }));

    const threadRef = useRef(null);
    const dragState = useRef({
        dragging: false,
        moved: false,
        offsetX: 0,
        offsetY: 0,
        startX: 0,
        startY: 0
    });

    const selectedAvatar = AVATARS.find((avatar) => avatar.id === avatarId) || AVATARS[0];

    useEffect(() => {
        if (!threadRef.current) return;
        threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, [messages, loading, open]);

    useEffect(() => {
        if (!open) setPickerOpen(false);
    }, [open]);

    useEffect(() => {
        const keepInBounds = () => {
            setPosition((current) => ({
                x: clamp(current.x, 12, window.innerWidth - AVATAR_SIZE - 12),
                y: clamp(current.y, 12, window.innerHeight - AVATAR_SIZE - 12 - bottomReserve())
            }));
        };
        window.addEventListener("resize", keepInBounds);
        return () => window.removeEventListener("resize", keepInBounds);
    }, []);

    useEffect(() => {
        const onMove = (event) => {
            if (!dragState.current.dragging) return;
            const point = event.touches?.[0] || event;
            const nextX = point.clientX - dragState.current.offsetX;
            const nextY = point.clientY - dragState.current.offsetY;
            if (
                Math.abs(point.clientX - dragState.current.startX) > 4
                || Math.abs(point.clientY - dragState.current.startY) > 4
            ) {
                dragState.current.moved = true;
            }
            setPosition({
                x: clamp(nextX, 12, window.innerWidth - AVATAR_SIZE - 12),
                y: clamp(nextY, 12, window.innerHeight - AVATAR_SIZE - 12 - bottomReserve())
            });
        };

        const onUp = () => {
            if (!dragState.current.dragging) return;
            const wasMoved = dragState.current.moved;
            dragState.current.dragging = false;
            if (!wasMoved) {
                setOpen((current) => !current);
            }
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
    }, []);

    const startDrag = (event) => {
        const point = event.touches?.[0] || event;
        dragState.current = {
            dragging: true,
            moved: false,
            offsetX: point.clientX - position.x,
            offsetY: point.clientY - position.y,
            startX: point.clientX,
            startY: point.clientY
        };
    };

    const selectAvatar = (id) => {
        setAvatarId(id);
        setPickerOpen(false);
        try {
            localStorage.setItem(AVATAR_STORAGE_KEY, id);
        }
        catch {
            // ignore storage errors
        }
    };

    const ask = async (question) => {
        const text = question.trim();
        if (!text || loading) return;

        setMessage("");
        setMessages((current) => [...current, { role: "user", text }]);

        try {
            setLoading(true);
            const result = await ChatService.ask(text);
            setMessages((current) => [...current, { role: "assistant", text: result.answer }]);
        }
        catch (askError) {
            const errorText = askError.response?.data?.message || "Failed to get an answer";
            setMessages((current) => [...current, { role: "assistant", text: errorText, isError: true }]);
        }
        finally {
            setLoading(false);
        }
    };

    const panelLeft = clamp(
        position.x - PANEL_WIDTH + AVATAR_SIZE,
        12,
        Math.max(12, window.innerWidth - PANEL_WIDTH - 12)
    );
    const panelTop = clamp(
        position.y - PANEL_HEIGHT - 14,
        12,
        Math.max(12, window.innerHeight - PANEL_HEIGHT - 12 - bottomReserve())
    );

    return (
        <div className="floating-hr-chat">
            {open && (
                <div
                    className={`floating-chat-panel${pickerOpen ? " with-picker" : ""}`}
                    style={{ left: panelLeft, top: panelTop }}
                >
                    <div className="floating-chat-head">
                        <div>
                            <p className="eyebrow">HR assistant</p>
                            <h3>Workforce chat</h3>
                        </div>
                        <div className="floating-chat-head-actions">
                            <button
                                type="button"
                                className="avatar-change-btn"
                                onClick={() => setPickerOpen((current) => !current)}
                                aria-expanded={pickerOpen}
                            >
                                Change avatar
                            </button>
                            <button type="button" className="icon-close" onClick={() => setOpen(false)}>×</button>
                        </div>
                    </div>

                    {pickerOpen && (
                        <div className="avatar-picker" role="listbox" aria-label="Choose chat avatar">
                            {AVATARS.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    type="button"
                                    role="option"
                                    aria-selected={avatar.id === selectedAvatar.id}
                                    className={`avatar-option${avatar.id === selectedAvatar.id ? " selected" : ""}`}
                                    style={{ background: avatar.color }}
                                    onClick={() => selectAvatar(avatar.id)}
                                    title={avatar.label}
                                >
                                    <span className="avatar-glyph">{avatar.glyph}</span>
                                    <span className="avatar-option-label">{avatar.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="floating-chat-thread" ref={threadRef}>
                        {messages.length === 0 && !loading && (
                            <div className="chat-empty compact">
                                <p>Ask a workforce question:</p>
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

                    <form
                        className="chat-compose floating-chat-compose"
                        onSubmit={(event) => {
                            event.preventDefault();
                            ask(message);
                        }}
                    >
                        <input
                            type="text"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Ask about workforce data..."
                            disabled={loading}
                        />
                        <button type="submit" className="primary-btn" disabled={loading || !message.trim()}>
                            {loading ? "..." : "Ask"}
                        </button>
                    </form>
                </div>
            )}

            <button
                type="button"
                className={`floating-chat-avatar${open ? " open" : ""}`}
                style={{ left: position.x, top: position.y, background: selectedAvatar.color }}
                onPointerDown={startDrag}
                aria-label="Open HR chat"
                title="Drag to move · Click to chat"
            >
                <span className="avatar-glyph">{selectedAvatar.glyph}</span>
            </button>
        </div>
    );
}

export default FloatingHRChat;
