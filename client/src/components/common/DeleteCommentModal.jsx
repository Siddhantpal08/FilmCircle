import { createPortal } from 'react-dom';

/**
 * DeleteCommentModal
 * A dedicated confirmation modal for comment deletion.
 *
 * Uses ReactDOM.createPortal to render directly into document.body,
 * escaping any overflow:hidden or CSS-transform stacking context
 * that would otherwise clip position:fixed children inside PostCard.
 *
 * Props:
 *   open        {boolean}  — whether the modal is visible
 *   onCancel    {fn}       — called when Cancel or the overlay is clicked
 *   onConfirm   {fn}       — called when Delete is clicked
 *   confirming  {boolean}  — true while the delete API call is in-flight
 */
export default function DeleteCommentModal({ open, onCancel, onConfirm, confirming = false }) {
    if (!open) return null;

    const modal = (
        /* Overlay — clicking it cancels */
        <div
            role="presentation"
            onClick={onCancel}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.78)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem',
                animation: 'dcm-overlay-in 0.15s ease',
            }}
        >
            {/* Modal card — stopPropagation so the overlay click doesn't close it */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="dcm-title"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(89, 65, 61, 0.28)',
                    borderRadius: '12px',
                    padding: '1.75rem 2rem',
                    maxWidth: '400px',
                    width: '100%',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
                    animation: 'dcm-modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                {/* Title */}
                <h3
                    id="dcm-title"
                    style={{
                        margin: '0 0 0.5rem',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '-0.01em',
                    }}
                >
                    Delete Comment?
                </h3>

                {/* Subtitle */}
                <p
                    style={{
                        margin: '0 0 1.75rem',
                        fontSize: '0.875rem',
                        color: '#8c8c8c',
                        lineHeight: 1.5,
                    }}
                >
                    This action cannot be undone.
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    {/* Cancel */}
                    <button
                        type="button"
                        disabled={confirming}
                        onClick={onCancel}
                        style={{
                            padding: '0.55rem 1.2rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            background: '#2e2e2e',
                            color: '#cccccc',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            cursor: confirming ? 'not-allowed' : 'pointer',
                            opacity: confirming ? 0.55 : 1,
                            transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            if (!confirming) {
                                e.currentTarget.style.background = '#3a3a3a';
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#2e2e2e';
                            e.currentTarget.style.color = '#cccccc';
                        }}
                    >
                        Cancel
                    </button>

                    {/* Delete */}
                    <button
                        type="button"
                        disabled={confirming}
                        onClick={onConfirm}
                        style={{
                            padding: '0.55rem 1.2rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#C0392B',
                            color: '#ffffff',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            fontFamily: 'inherit',
                            cursor: confirming ? 'not-allowed' : 'pointer',
                            opacity: confirming ? 0.55 : 1,
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { if (!confirming) e.currentTarget.style.background = '#a93226'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#C0392B'; }}
                    >
                        {confirming ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>

            {/* Keyframe animations — kept here so they travel with the portal */}
            <style>{`
                @keyframes dcm-overlay-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes dcm-modal-in {
                    from { opacity: 0; transform: scale(0.93) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );

    // Portal: render outside the PostCard DOM tree so position:fixed
    // is not clipped by overflow:hidden or CSS-transform ancestors.
    return createPortal(modal, document.body);
}
