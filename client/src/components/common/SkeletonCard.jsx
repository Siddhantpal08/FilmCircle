export default function SkeletonCard() {
    return (
        <>
            <div className="sk-card">
                <div className="sk-poster skeleton"></div>
                <div className="sk-body">
                    <div className="sk-title skeleton"></div>
                    <div className="sk-meta skeleton"></div>
                </div>
            </div>
            <style>{`
                .sk-card {
                    width: 100%;
                    border-radius: var(--radius);
                    overflow: hidden;
                }
                .sk-poster {
                    width: 100%;
                    aspect-ratio: 2/3;
                    border-radius: var(--radius);
                    margin-bottom: 0.75rem;
                }
                .sk-body { padding: 0 0.25rem; }
                .sk-title { height: 0.875rem; border-radius: 4px; margin-bottom: 0.4rem; width: 80%; }
                .sk-meta  { height: 0.75rem;  border-radius: 4px; width: 55%; }
            `}</style>
        </>
    );
}
