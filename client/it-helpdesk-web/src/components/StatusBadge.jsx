const styles = {
  Open: 'badge-open',
  'In Progress': 'badge-progress',
  Pending: 'badge-pending',
  Resolved: 'badge-resolved',
  Closed: 'badge-closed',
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${styles[status] || 'badge-default'}`}>{status}</span>;
}
