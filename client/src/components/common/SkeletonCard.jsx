export default function SkeletonCard() {
    return (
        <div className="card movie-card skeleton-card">
            <div className="skeleton-poster"></div>
            <div className="movie-card-body">
                <div className="skeleton-title"></div>
                <div className="skeleton-subtitle"></div>
            </div>
            <style>{`
                .skeleton-card { display: flex; flex-direction: column; overflow: hidden; background: var(--clr-surface); }
                .skeleton-poster { width: 100%; aspect-ratio: 2/3; background: var(--clr-surface-2); animation: pulse 1.5s infinite ease-in-out; }
                .skeleton-title { height: 1rem; background: var(--clr-surface-2); border-radius: 4px; margin-bottom: 0.5rem; width: 80%; animation: pulse 1.5s infinite ease-in-out; }
                .skeleton-subtitle { height: 0.8rem; background: var(--clr-surface-2); border-radius: 4px; width: 50%; animation: pulse 1.5s infinite ease-in-out; }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
