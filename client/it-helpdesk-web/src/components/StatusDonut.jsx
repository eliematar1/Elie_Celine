import { STATUS_COLORS } from './BarChart';

const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#64748b', '#ec4899'];

export default function StatusDonut({ items }) {
  const total = items?.reduce((sum, i) => sum + i.count, 0) ?? 0;

  if (!total) {
    return <p className="text-muted">No data available.</p>;
  }

  let angle = 0;
  const segments = items.map((item, idx) => {
    const pct = item.count / total;
    const start = angle;
    angle += pct * 360;
    const color = STATUS_COLORS[item.status] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    return { ...item, start, end: angle, color };
  });

  const gradient = segments
    .map((s) => `${s.color} ${s.start}deg ${s.end}deg`)
    .join(', ');

  return (
    <div className="priority-chart">
      <div className="donut-wrap">
        <div className="donut" style={{ background: `conic-gradient(${gradient})` }} />
        <div className="donut-center">
          {total}
          <small>tickets</small>
        </div>
      </div>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.status}>
            <span className="dot" style={{ background: s.color }} />
            {s.status} ({s.count})
          </li>
        ))}
      </ul>
    </div>
  );
}
