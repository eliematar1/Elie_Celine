export default function StatCard({ label, value, icon, accent }) {
  return (
    <div className={`stat-card ${accent || ''}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
