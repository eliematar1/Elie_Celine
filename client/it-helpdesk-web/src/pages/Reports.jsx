import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import StatCard from '../components/StatCard';
import BarChart, { PRIORITY_COLORS } from '../components/BarChart';
import StatusDonut from '../components/StatusDonut';
import MonthlyTrendChart from '../components/MonthlyTrendChart';
import { useAuth } from '../context/AuthContext';
import { AppRoles } from '../constants/roles';
import { reportsApi } from '../services/ticketsApi';

export default function Reports() {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  const isAdmin = hasRole(AppRoles.Admin);

  useEffect(() => {
    reportsApi
      .get()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load reports. Admin or Manager access required.'));
  }, []);

  const exportCsv = async () => {
    const res = await reportsApi.exportCsv();
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    const header = reportRef.current.querySelector('.reports-pdf-header');
    try {
      if (header) header.style.display = 'block';
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let position = 0;
      let heightLeft = imgH;

      pdf.addImage(img, 'PNG', 0, position, pageW, imgH);
      heightLeft -= pageH;

      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(img, 'PNG', 0, position, pageW, imgH);
        heightLeft -= pageH;
      }

      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`it-helpdesk-report-${date}.pdf`);
    } catch {
      setError('PDF export failed. Please try again.');
    } finally {
      if (header) header.style.display = '';
      setExporting(false);
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="text-muted">Loading reports…</p>;

  const openTickets = (data.byStatus || [])
    .filter((s) => !['Resolved', 'Closed'].includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports &amp; analytics</h1>
          <p className="page-sub">
            {isAdmin ? 'Admin overview' : 'Manager overview'} — charts, agent performance &amp; exports
          </p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-secondary" onClick={exportCsv}>
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={exportPdf}
            disabled={exporting}
          >
            {exporting ? 'Generating PDF…' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="reports-export">
        <div className="reports-pdf-header">
          <div>
            <h2>IT Help Desk — Analytics Report</h2>
            <p>
              Generated {new Date().toLocaleString()} · {user?.firstName} {user?.lastName} ({user?.roles?.[0]})
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard label="Total tickets" value={data.totalTickets} icon="📊" />
          <StatCard label="Resolved" value={data.resolvedTickets} icon="✓" accent="accent-green" />
          <StatCard label="Open / active" value={openTickets} icon="📋" accent="accent-blue" />
          <StatCard label="Avg. resolution" value={`${data.avgResolutionDays}d`} icon="⏱" accent="accent-amber" />
        </div>

        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">Monthly ticket volume</h3>
            <MonthlyTrendChart items={data.monthlyTrend} />
          </div>
          <div className="card">
            <h3 className="card-title">Tickets by status</h3>
            <StatusDonut items={data.byStatus} />
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">Tickets by category</h3>
            <BarChart items={data.byCategory} labelKey="category" color="#3b82f6" />
          </div>
          <div className="card">
            <h3 className="card-title">Tickets by priority</h3>
            <BarChart
              items={data.byPriority}
              labelKey="priority"
              colorMap={PRIORITY_COLORS}
              color="#8b5cf6"
            />
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Agent performance</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Resolved</th>
                  <th>Open</th>
                  <th>Avg. time</th>
                  <th>Resolution rate</th>
                </tr>
              </thead>
              <tbody>
                {(data.agentPerformance || []).map((a) => {
                  const total = a.resolved + a.open;
                  const rate = total > 0 ? Math.round((a.resolved / total) * 100) : 0;
                  return (
                    <tr key={a.agentName}>
                      <td>{a.agentName}</td>
                      <td>{a.resolved}</td>
                      <td>{a.open}</td>
                      <td>{a.avgDays} days</td>
                      <td>
                        <div className="inline-bar">
                          <div className="inline-bar-track">
                            <div className="inline-bar-fill" style={{ width: `${rate}%` }} />
                          </div>
                          <span>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
