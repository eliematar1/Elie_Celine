export default function MonthlyTrendChart({ items }) {
  const max = Math.max(
    ...(items?.flatMap((i) => [i.created, i.resolved]) || [1]),
    1
  );

  if (!items?.length) {
    return <p className="text-muted">No data available.</p>;
  }

  return (
    <div className="trend-chart">
      <div className="trend-legend">
        <span><i className="trend-dot created" /> Created</span>
        <span><i className="trend-dot resolved" /> Resolved</span>
      </div>
      <div className="trend-bars">
        {items.map((m) => (
          <div key={m.month} className="trend-col">
            <div className="trend-pair">
              <div
                className="trend-bar created"
                style={{ height: `${(m.created / max) * 100}%` }}
                title={`Created: ${m.created}`}
              />
              <div
                className="trend-bar resolved"
                style={{ height: `${(m.resolved / max) * 100}%` }}
                title={`Resolved: ${m.resolved}`}
              />
            </div>
            <span className="trend-label">{m.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
