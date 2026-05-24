export default function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    confirming = false,
}) {
    if (!open) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onCancel} role="presentation">
            <div
                className="confirm-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="confirm-modal-title" className="confirm-modal-title">{title}</h3>
                {message && <p className="confirm-modal-message">{message}</p>}
                <div className="confirm-modal-actions">
                    <button type="button" className="confirm-modal-cancel" onClick={onCancel} disabled={confirming}>
                        {cancelLabel}
                    </button>
                    <button type="button" className="confirm-modal-delete" onClick={onConfirm} disabled={confirming}>
                        {confirming ? 'Deleting…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
