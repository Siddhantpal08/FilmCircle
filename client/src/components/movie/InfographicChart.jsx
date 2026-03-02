import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const LABELS = ['Skip', 'Considerable', 'Go For It', 'Excellent'];
const COLORS = ['#e84545', '#f7b731', '#3498db', '#2ecc71'];
const KEYS = ['skip', 'considerable', 'goForIt', 'excellent'];

export default function InfographicChart({ distribution, percentages, total }) {
    if (!distribution || total === 0) {
        return (
            <div className="chart-empty">
                <span>🎬</span>
                <p>No reviews yet — be the first!</p>
            </div>
        );
    }

    const data = {
        labels: LABELS,
        datasets: [{
            data: KEYS.map(k => distribution[k] || 0),
            backgroundColor: COLORS,
            borderColor: '#13131f',
            borderWidth: 2,
            hoverOffset: 6,
        }],
    };

    const options = {
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: ctx => ` ${ctx.label}: ${ctx.raw} votes (${percentages[KEYS[ctx.dataIndex]]}%)`,
                },
            },
        },
        cutout: '65%',
        responsive: true,
    };

    return (
        <div className="infographic">
            <div className="chart-wrap">
                <Doughnut data={data} options={options} />
                <div className="chart-center">
                    <span className="chart-total">{total}</span>
                    <span className="chart-label-sub">reviews</span>
                </div>
            </div>
            <div className="chart-legend">
                {KEYS.map((k, i) => (
                    <div key={k} className="legend-item">
                        <span className="legend-dot" style={{ background: COLORS[i] }} />
                        <span className="legend-name">{LABELS[i]}</span>
                        <span className="legend-pct">{percentages[k] || 0}%</span>
                        <span className="legend-count">({distribution[k] || 0})</span>
                    </div>
                ))}
            </div>
            <style>{`
        .infographic { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
        .chart-wrap { position: relative; width: 160px; height: 160px; flex-shrink: 0; }
        .chart-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; }
        .chart-total { display: block; font-size: 1.6rem; font-weight: 700; font-family: var(--ff-heading); color: var(--clr-text); }
        .chart-label-sub { font-size: 0.7rem; color: var(--clr-text-muted); }
        .chart-legend { display: flex; flex-direction: column; gap: 0.5rem; }
        .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .legend-name { color: var(--clr-text); flex: 1; }
        .legend-pct { font-weight: 700; color: var(--clr-text); }
        .legend-count { color: var(--clr-text-muted); }
        .chart-empty { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem; color: var(--clr-text-muted); font-size: 0.9rem; }
        .chart-empty span { font-size: 2rem; }
      `}</style>
        </div>
    );
}
