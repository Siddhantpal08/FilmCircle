export default function Loader({ fullPage = false }) {
    if (fullPage) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--clr-bg)' }}>
                <div className="loader-ring" />
            </div>
        );
    }
    return <div className="loader-ring" style={{ margin: '2rem auto' }} />;
}

// Add this to index.css or inline — using inline style for portability
const style = document.createElement('style');
style.textContent = `
.loader-ring {
  width: 44px; height: 44px;
  border: 3px solid var(--clr-border);
  border-top-color: var(--clr-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
`;
if (typeof document !== 'undefined') document.head.appendChild(style);
