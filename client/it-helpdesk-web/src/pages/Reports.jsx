import StatCard from '../components/StatCard';
import { STATS } from '../data/mockData';

export default function Reports() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports &amp; analytics</h1>
          <p className="page-sub">Monthly metrics and agent performance</p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-secondary">Export PDF</button>
          <button type="button" className="btn btn-secondary">Export Excel</button>
        </div>
      </div>

      <div className="card filters-card">
        <input type="date" className="filter-input" />
        <input type="date" className="filter-input" />
        <button type="button" className="btn btn-primary">Apply</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Avg. resolution" value="4.2d" icon="⏱" />
        <StatCard label="SLA met" value="94%" icon="✓" accent="accent-green" />
        <StatCard label="Total this month" value={STATS.resolvedMonth + STATS.open} icon="📊" />
      </div>

      <div className="card">
        <h3 className="card-title">Agent performance</h3>
        <table className="data-table">
          <thead>
            <tr><th>Agent</th><th>Resolved</th><th>Open</th><th>Avg. time</th></tr>
          </thead>
          <tbody>
            <tr><td>J. Smith</td><td>45</td><td>3</td><td>3.1 days</td></tr>
            <tr><td>A. Lee</td><td>38</td><td>5</td><td>4.8 days</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
