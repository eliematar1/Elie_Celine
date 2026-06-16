import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { reportsApi } from '../services/ticketsApi';

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    reportsApi.get().then((res) => setData(res.data)).catch(() => {});
  }, []);

  const exportCsv = async () => {
    const res = await reportsApi.exportCsv();
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets-report.csv';
    a.click();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports &amp; analytics</h1>
          <p className="page-sub">Monthly metrics and agent performance</p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-secondary" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      {data && (
        <>
          <div className="stats-grid">
            <StatCard label="Total tickets" value={data.totalTickets} icon="📊" />
            <StatCard label="Resolved" value={data.resolvedTickets} icon="✓" accent="accent-green" />
            <StatCard label="Avg. resolution" value={`${data.avgResolutionDays}d`} icon="⏱" />
          </div>
          <div className="card">
            <h3 className="card-title">Agent performance</h3>
            <table className="data-table">
              <thead><tr><th>Agent</th><th>Resolved</th><th>Open</th><th>Avg. time</th></tr></thead>
              <tbody>
                {(data.agentPerformance || []).map((a) => (
                  <tr key={a.agentName}><td>{a.agentName}</td><td>{a.resolved}</td><td>{a.open}</td><td>{a.avgDays} days</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
