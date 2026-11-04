import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const pushToast = useCallback((message, type = "success", duration = 3200) => {
        if (!message) return;
        const id = ++toastId;
        setToasts((current) => [...current, { id, message, type }]);
        window.setTimeout(() => removeToast(id), duration);
    }, [removeToast]);

    const value = useMemo(() => ({
        success: (message) => pushToast(message, "success"),
        error: (message) => pushToast(message, "error"),
        info: (message) => pushToast(message, "info")
    }), [pushToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-stack" aria-live="polite" aria-relevant="additions">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
                        <span>{toast.message}</span>
                        <button type="button" className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Dismiss">
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}
