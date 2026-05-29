export const STATS = {
  open: 24,
  inProgress: 12,
  pending: 5,
  resolvedMonth: 89,
};

export const TICKETS = [
  {
    id: 1,
    ref: 'TKT-2026-00042',
    title: 'Outlook not syncing',
    category: 'Email',
    priority: 'Medium',
    status: 'Open',
    agent: '—',
    created: 'May 24, 2026',
    description: 'Emails stuck in outbox since this morning after Windows update.',
    requester: 'C. Mortada',
  },
  {
    id: 2,
    ref: 'TKT-2026-00041',
    title: 'VPN connection failed',
    category: 'Network',
    priority: 'High',
    status: 'In Progress',
    agent: 'J. Smith',
    created: 'May 23, 2026',
    description: 'Cannot connect to corporate VPN from home. Authentication failed.',
    requester: 'E. Matar',
  },
  {
    id: 3,
    ref: 'TKT-2026-00040',
    title: "Laptop won't boot",
    category: 'Hardware',
    priority: 'Critical',
    status: 'Pending',
    agent: 'A. Lee',
    created: 'May 22, 2026',
    description: 'Device powers on but shows black screen. External monitor works.',
    requester: 'Finance Dept',
  },
  {
    id: 4,
    ref: 'TKT-2026-00039',
    title: 'Need access to shared drive',
    category: 'Access Request',
    priority: 'Low',
    status: 'Resolved',
    agent: 'J. Smith',
    created: 'May 20, 2026',
    description: 'Request read/write access to \\\\fileserver\\projects',
    requester: 'Marketing',
  },
];

export const CATEGORY_CHART = [
  { label: 'Software', value: 32, color: '#3b82f6' },
  { label: 'Hardware', value: 18, color: '#8b5cf6' },
  { label: 'Network', value: 14, color: '#06b6d4' },
  { label: 'Email', value: 22, color: '#f59e0b' },
  { label: 'Access', value: 9, color: '#10b981' },
  { label: 'Other', value: 5, color: '#64748b' },
];

export const NOTIFICATIONS = [
  { id: 1, title: 'Ticket assigned', message: 'TKT-2026-00041 assigned to you.', time: '2h ago', unread: true },
  { id: 2, title: 'Status updated', message: 'TKT-2026-00040 is now Pending.', time: '5h ago', unread: true },
  { id: 3, title: 'New comment', message: 'Employee replied on TKT-2026-00038.', time: 'Yesterday', unread: false },
];

export const CATEGORIES = ['Hardware', 'Software', 'Network', 'Email', 'Access Request', 'Other'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const STATUSES = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
