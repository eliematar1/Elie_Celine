const styles = {
  Low: 'priority-low',
  Medium: 'priority-medium',
  High: 'priority-high',
  Critical: 'priority-critical',
};

export default function PriorityBadge({ priority }) {
  return <span className={`badge ${styles[priority] || ''}`}>{priority}</span>;
}
