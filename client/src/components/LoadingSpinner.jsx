function LoadingSpinner({ label = "Loading...", fullPage = false, compact = false }) {
    return (
        <div className={`loading-spinner${fullPage ? " full-page" : ""}${compact ? " compact" : ""}`} role="status" aria-live="polite">
            <span className="spinner-ring" aria-hidden="true" />
            {label && <p>{label}</p>}
        </div>
    );
}

export default LoadingSpinner;
