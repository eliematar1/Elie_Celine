const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
};

const STATUS_COLORS = {
  Open: '#3b82f6',
  'In Progress': '#8b5cf6',
  Pending: '#f59e0b',
  Resolved: '#10b981',
  Closed: '#64748b',
};

export default function BarChart({ items, labelKey, valueKey = 'count', color = '#3b82f6', colorMap }) {
  const max = Math.max(...(items?.map((i) => i[valueKey]) || [1]), 1);

  if (!items?.length) {
    return <p className="text-muted">No data available.</p>;
  }

  return (
    <div className="bar-chart">
      {items.map((item) => {
        const label = item[labelKey];
        const value = item[valueKey];
        const fill = colorMap?.[label] ?? color;
        return (
          <div key={label} className="bar-row">
            <span className="bar-label">{label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(value / max) * 100}%`, background: fill }} />
            </div>
            <span className="bar-val">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

export { PRIORITY_COLORS, STATUS_COLORS };
