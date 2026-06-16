/**
 * IT Help Desk API — Node.js dev server mirroring ASP.NET Core endpoints.
 * In-memory data store. Run: npm start (port 5000)
 */
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5000;
const JWT_KEY = 'ITHelpDesk-Super-Secret-Key-Min-32-Chars-Long!!';
const JWT_ISSUER = 'ITHelpDesk.API';
const JWT_AUDIENCE = 'ITHelpDesk.Client';

const ROLES = {
  Admin: 'Admin',
  Agent: 'IT Support Agent',
  Employee: 'Employee',
  Manager: 'Manager',
};
const ALL_ROLES = Object.values(ROLES);

// ── In-memory stores ──────────────────────────────────────────────────────────
const users = [];
const tickets = [];
const comments = [];
const attachments = [];
const assignments = [];
const statusHistory = [];
const notifications = [];
const activityLogs = [];

let categories = [];
let priorities = [];
let statuses = [];

let nextUserId = 1;
let nextTicketId = 1;
let nextCommentId = 1;
let nextAttachmentId = 1;
let nextAssignmentId = 1;
let nextHistoryId = 1;
let nextNotificationId = 1;
let nextActivityId = 1;

// ── Helpers ───────────────────────────────────────────────────────────────────
function toProfile(u) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    department: u.department,
    roles: u.roles,
  };
}

function fullName(u) {
  return u ? `${u.firstName} ${u.lastName}` : null;
}

function findUser(id) {
  return users.find((u) => u.id === id);
}

function hasRole(user, ...allowed) {
  return user.roles.some((r) => allowed.includes(r));
}

function getRolesFromToken(payload) {
  const roleClaim =
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
    payload.role;
  if (!roleClaim) return [];
  return Array.isArray(roleClaim) ? roleClaim : [roleClaim];
}

function signToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    jti: crypto.randomUUID(),
    name: `${user.firstName} ${user.lastName}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': user.roles,
  };
  return jwt.sign(payload, JWT_KEY, {
    expiresIn: '1h',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

function logActivity(userId, action, entityType, entityId, details = null) {
  activityLogs.unshift({
    id: nextActivityId++,
    userId,
    action,
    entityType,
    entityId: String(entityId),
    details,
    createdAt: new Date().toISOString(),
  });
}

function notify(userId, title, message, type = 'System', ticketId = null) {
  notifications.unshift({
    id: nextNotificationId++,
    userId,
    title,
    message,
    type,
    ticketId,
    isRead: false,
    createdAt: new Date().toISOString(),
    readAt: null,
  });
}

function getCategory(id) {
  return categories.find((c) => c.id === id);
}
function getPriority(id) {
  return priorities.find((p) => p.id === id);
}
function getStatus(id) {
  return statuses.find((s) => s.id === id);
}
function getStatusByName(name) {
  return statuses.find((s) => s.name === name);
}

function queryTicketsForUser(user) {
  let q = tickets.filter((t) => !t.isDeleted);
  if (hasRole(user, ROLES.Admin, ROLES.Manager)) return q;
  if (hasRole(user, ROLES.Agent)) {
    return q.filter((t) => t.assignedToUserId === user.id || t.assignedToUserId == null);
  }
  return q.filter((t) => t.createdByUserId === user.id);
}

function getTicketForUser(id, user) {
  return queryTicketsForUser(user).find((t) => t.id === id) ?? null;
}

function generateReference() {
  const year = new Date().getUTCFullYear();
  const count = tickets.filter((t) => new Date(t.createdAt).getUTCFullYear() === year).length + 1;
  return `TKT-${year}-${String(count).padStart(5, '0')}`;
}

function mapTicketList(t) {
  const cat = getCategory(t.categoryId);
  const pri = getPriority(t.priorityId);
  const st = getStatus(t.statusId);
  const assigned = findUser(t.assignedToUserId);
  const creator = findUser(t.createdByUserId);
  return {
    id: t.id,
    referenceNumber: t.referenceNumber,
    title: t.title,
    category: cat?.name ?? '',
    priority: pri?.name ?? '',
    status: st?.name ?? '',
    assignedToName: fullName(assigned),
    createdByName: fullName(creator),
    createdAt: t.createdAt,
  };
}

function mapTicketDetail(t, userRoles) {
  const cat = getCategory(t.categoryId);
  const pri = getPriority(t.priorityId);
  const st = getStatus(t.statusId);
  const assigned = findUser(t.assignedToUserId);
  const creator = findUser(t.createdByUserId);
  const canSeeInternal = userRoles.some((r) => r === ROLES.Admin || r === ROLES.Agent);

  const ticketComments = comments
    .filter((c) => c.ticketId === t.id && (!c.isInternal || canSeeInternal))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((c) => {
      const author = findUser(c.userId);
      return {
        id: c.id,
        authorName: fullName(author),
        body: c.body,
        isInternal: c.isInternal,
        createdAt: c.createdAt,
      };
    });

  const ticketAttachments = attachments
    .filter((a) => a.ticketId === t.id)
    .map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileSizeBytes: a.fileSizeBytes,
      uploadedAt: a.uploadedAt,
    }));

  const ticketHistory = statusHistory
    .filter((h) => h.ticketId === t.id)
    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
    .map((h) => ({
      fromStatus: h.fromStatusId ? getStatus(h.fromStatusId)?.name ?? null : null,
      toStatus: getStatus(h.toStatusId)?.name ?? '',
      changedByName: '',
      changedAt: h.changedAt,
    }));

  return {
    id: t.id,
    referenceNumber: t.referenceNumber,
    title: t.title,
    description: t.description,
    category: cat?.name ?? '',
    categoryId: t.categoryId,
    priority: pri?.name ?? '',
    priorityId: t.priorityId,
    status: st?.name ?? '',
    statusId: t.statusId,
    createdByName: fullName(creator),
    assignedToName: fullName(assigned),
    assignedToUserId: t.assignedToUserId,
    createdAt: t.createdAt,
    resolvedAt: t.resolvedAt,
    comments: ticketComments,
    attachments: ticketAttachments,
    statusHistory: ticketHistory,
  };
}

function logStatusChange(ticket, fromId, toId, userId, notes = null) {
  statusHistory.push({
    id: nextHistoryId++,
    ticketId: ticket.id,
    fromStatusId: fromId,
    toStatusId: toId,
    changedByUserId: userId,
    changedAt: new Date().toISOString(),
    notes,
  });
  const toStatus = getStatus(toId);
  if (toStatus?.name === 'Resolved') ticket.resolvedAt = new Date().toISOString();
  if (toStatus?.isClosed) ticket.closedAt = new Date().toISOString();
  ticket.statusId = toId;
  ticket.updatedAt = new Date().toISOString();
}

// ── AI service (mirrors AiService.cs) ─────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  outlook: 'Software',
  email: 'Email',
  vpn: 'Network',
  wifi: 'Network',
  laptop: 'Hardware',
  printer: 'Hardware',
  password: 'Access Request',
  access: 'Access Request',
};

function aiSuggest(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  let category = 'Other';
  for (const [kw, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (text.includes(kw)) {
      category = cat;
      break;
    }
  }
  const priority =
    text.includes('critical') || text.includes('server down') || text.includes('offline')
      ? 'Critical'
      : text.includes('urgent') || text.includes('cannot work')
        ? 'High'
        : 'Medium';
  return { category, priority };
}

function aiSuggestReply(title) {
  return `Thank you for reporting "${title}". Please try: 1) Restart the application 2) Check network connection 3) Contact IT if issue persists.`;
}

function aiChatAnswer(question) {
  const q = question.toLowerCase();
  if (q.includes('vpn')) return 'VPN setup: Open Cisco AnyConnect, enter vpn.company.com, use your AD credentials.';
  if (q.includes('password')) return 'Reset password via https://password.company.com or contact IT help desk.';
  if (q.includes('wifi')) return 'Connect to CORP-WIFI using your employee credentials.';
  return 'I can help with VPN, password reset, and Wi-Fi. For other issues, please create a support ticket.';
}

// ── Seed data ─────────────────────────────────────────────────────────────────
async function seed() {
  if (users.length) return;

  const seeds = [
    ['admin@ithelpdesk.local', 'Admin@123', 'System', 'Admin', 'IT', [ROLES.Admin]],
    ['employee@ithelpdesk.local', 'Employee@123', 'Demo', 'Employee', 'Sales', [ROLES.Employee]],
    ['agent@ithelpdesk.local', 'Agent@123', 'IT', 'Agent', 'IT Support', [ROLES.Agent]],
    ['manager@ithelpdesk.local', 'Manager@123', 'Team', 'Manager', 'Operations', [ROLES.Manager]],
  ];

  for (const [email, pw, fn, ln, dept, roles] of seeds) {
    users.push({
      id: String(nextUserId++),
      email,
      passwordHash: await bcrypt.hash(pw, 10),
      firstName: fn,
      lastName: ln,
      department: dept,
      roles,
      isActive: true,
      lastLoginAt: null,
    });
  }

  categories = [
    { id: 1, name: 'Hardware', description: null, isActive: true, sortOrder: 1 },
    { id: 2, name: 'Software', description: null, isActive: true, sortOrder: 2 },
    { id: 3, name: 'Network', description: null, isActive: true, sortOrder: 3 },
    { id: 4, name: 'Email', description: null, isActive: true, sortOrder: 4 },
    { id: 5, name: 'Access Request', description: null, isActive: true, sortOrder: 5 },
    { id: 6, name: 'Other', description: null, isActive: true, sortOrder: 6 },
  ];

  priorities = [
    { id: 1, name: 'Low', level: 1, colorHex: '#22c55e', isActive: true },
    { id: 2, name: 'Medium', level: 2, colorHex: '#eab308', isActive: true },
    { id: 3, name: 'High', level: 3, colorHex: '#f97316', isActive: true },
    { id: 4, name: 'Critical', level: 4, colorHex: '#ef4444', isActive: true },
  ];

  statuses = [
    { id: 1, name: 'Open', description: null, isClosed: false, sortOrder: 1 },
    { id: 2, name: 'In Progress', description: null, isClosed: false, sortOrder: 2 },
    { id: 3, name: 'Pending', description: null, isClosed: false, sortOrder: 3 },
    { id: 4, name: 'Resolved', description: null, isClosed: false, sortOrder: 4 },
    { id: 5, name: 'Closed', description: null, isClosed: true, sortOrder: 5 },
  ];

  const emp = users.find((u) => u.email === 'employee@ithelpdesk.local');
  const agent = users.find((u) => u.email === 'agent@ithelpdesk.local');
  const year = new Date().getUTCFullYear();
  const now = new Date();

  tickets.push(
    {
      id: nextTicketId++,
      referenceNumber: `TKT-${year}-00001`,
      title: 'Outlook not syncing',
      description: 'Emails stuck in outbox since morning.',
      categoryId: 4,
      priorityId: 2,
      statusId: 1,
      createdByUserId: emp.id,
      assignedToUserId: null,
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      resolvedAt: null,
      closedAt: null,
      isDeleted: false,
    },
    {
      id: nextTicketId++,
      referenceNumber: `TKT-${year}-00002`,
      title: 'VPN connection failed',
      description: 'Cannot connect to corporate VPN from home.',
      categoryId: 3,
      priorityId: 3,
      statusId: 2,
      createdByUserId: emp.id,
      assignedToUserId: agent.id,
      createdAt: new Date(now.getTime() - 172800000).toISOString(),
      updatedAt: new Date(now.getTime() - 172800000).toISOString(),
      resolvedAt: null,
      closedAt: null,
      isDeleted: false,
    }
  );

  statusHistory.push(
    {
      id: nextHistoryId++,
      ticketId: 1,
      fromStatusId: null,
      toStatusId: 1,
      changedByUserId: emp.id,
      changedAt: new Date(now.getTime() - 86400000).toISOString(),
      notes: 'Ticket created',
    },
    {
      id: nextHistoryId++,
      ticketId: 2,
      fromStatusId: null,
      toStatusId: 1,
      changedByUserId: emp.id,
      changedAt: new Date(now.getTime() - 172800000).toISOString(),
      notes: 'Ticket created',
    },
    {
      id: nextHistoryId++,
      ticketId: 2,
      fromStatusId: 1,
      toStatusId: 2,
      changedByUserId: agent.id,
      changedAt: new Date(now.getTime() - 86400000).toISOString(),
      notes: null,
    }
  );

  notify(agent.id, 'Ticket assigned', 'You were assigned TKT-' + year + '-00002.', 'Assignment', 2);
  notify(emp.id, 'Ticket update', 'Your ticket TKT-' + year + '-00002 is now In Progress.', 'StatusChange', 2);
  notify(emp.id, 'Welcome', 'Welcome to IT Help Desk. Create a ticket anytime you need support.', 'System', null);
}

// ── Middleware ──────────────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.auth = jwt.verify(header.slice(7), JWT_KEY, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    req.user = findUser(req.auth.sub);
    if (!req.user || !req.user.isActive) return res.status(401).json({ message: 'Unauthorized' });
    req.userRoles = getRolesFromToken(req.auth);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function requireRoles(...allowed) {
  return (req, res, next) => {
    if (!req.userRoles.some((r) => allowed.includes(r))) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10_485_760 },
});

// ── App setup ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'] }));
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'IT Help Desk API (Node dev)',
    database: 'InMemory',
    auth: 'JWT',
    time: new Date().toISOString(),
  });
});

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  await seed();
  const { email, password } = req.body || {};
  const user = users.find((u) => u.email === email && u.isActive);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  user.lastLoginAt = new Date().toISOString();
  logActivity(user.id, 'UserLogin', 'User', user.id);
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  res.json({ token: signToken(user), expiresAt, user: toProfile(user) });
});

app.post('/api/auth/register', async (req, res) => {
  await seed();
  const { email, password, firstName, lastName, department, role } = req.body || {};
  if (!ALL_ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role.' });
  if (users.some((u) => u.email === email)) {
    return res.status(400).json({ message: 'Email already registered.' });
  }
  const user = {
    id: String(nextUserId++),
    email,
    passwordHash: await bcrypt.hash(password, 10),
    firstName,
    lastName,
    department: department || null,
    roles: [role],
    isActive: true,
    lastLoginAt: null,
  };
  users.push(user);
  logActivity(user.id, 'UserRegistered', 'User', user.id, `Role: ${role}`);
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  res.json({ token: signToken(user), expiresAt, user: toProfile(user) });
});

app.get('/api/auth/me', authMiddleware, (req, res) => res.json(toProfile(req.user)));

app.put('/api/auth/profile', authMiddleware, (req, res) => {
  const { firstName, lastName, department } = req.body || {};
  req.user.firstName = firstName;
  req.user.lastName = lastName;
  req.user.department = department;
  logActivity(req.user.id, 'ProfileUpdated', 'User', req.user.id);
  res.json(toProfile(req.user));
});

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!(await bcrypt.compare(currentPassword, req.user.passwordHash))) {
    return res.status(400).json({
      message: 'Password change failed.',
      errors: ['Current password is incorrect.'],
    });
  }
  req.user.passwordHash = await bcrypt.hash(newPassword, 10);
  logActivity(req.user.id, 'PasswordChanged', 'User', req.user.id);
  res.json({ message: 'Password updated successfully.' });
});

app.get('/api/auth/activity-logs', authMiddleware, requireRoles(ROLES.Admin), (_req, res) => {
  const logs = activityLogs.slice(0, 50).map((l) => ({
    id: l.id,
    userId: l.userId,
    action: l.action,
    details: l.details,
    createdAt: l.createdAt,
  }));
  res.json(logs);
});

app.get('/api/auth/admin-only', authMiddleware, requireRoles(ROLES.Admin, ROLES.Manager), (_req, res) => {
  res.json({ message: 'You have Admin or Manager access.' });
});

app.get('/api/auth/agent-only', authMiddleware, requireRoles(ROLES.Agent), (_req, res) => {
  res.json({ message: 'You have IT Support Agent access.' });
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.get('/api/users', authMiddleware, requireRoles(ROLES.Admin), (_req, res) => {
  const result = [...users]
    .sort((a, b) => a.email.localeCompare(b.email))
    .map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      department: u.department,
      isActive: u.isActive,
      roles: u.roles,
      lastLoginAt: u.lastLoginAt,
    }));
  res.json(result);
});

app.get('/api/users/roles', authMiddleware, requireRoles(ROLES.Admin), (_req, res) => {
  res.json(ALL_ROLES);
});

// ── Tickets — lookups BEFORE :id routes ───────────────────────────────────────
app.get('/api/tickets/lookups', (_req, res) => {
  res.json({
    categories: categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    priorities: priorities.filter((p) => p.isActive).sort((a, b) => a.level - b.level),
    statuses: [...statuses].sort((a, b) => a.sortOrder - b.sortOrder),
  });
});

app.get('/api/tickets', authMiddleware, (req, res) => {
  const { search, statusId, categoryId } = req.query;
  let q = queryTicketsForUser(req.user);

  if (search) {
    const s = String(search).toLowerCase();
    q = q.filter(
      (t) => t.title.toLowerCase().includes(s) || t.referenceNumber.toLowerCase().includes(s)
    );
  }
  if (statusId) q = q.filter((t) => t.statusId === Number(statusId));
  if (categoryId) q = q.filter((t) => t.categoryId === Number(categoryId));

  const list = q
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 100)
    .map(mapTicketList);
  res.json(list);
});

app.get('/api/tickets/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const ticket = getTicketForUser(id, req.user);
  if (!ticket) return res.status(404).json({ message: 'Not found' });
  res.json(mapTicketDetail(ticket, req.userRoles));
});

app.post('/api/tickets', authMiddleware, (req, res) => {
  const { title, description, categoryId, priorityId } = req.body || {};
  const openStatus = getStatusByName('Open');
  const now = new Date().toISOString();

  const ticket = {
    id: nextTicketId++,
    referenceNumber: generateReference(),
    title,
    description,
    categoryId,
    priorityId,
    statusId: openStatus.id,
    createdByUserId: req.user.id,
    assignedToUserId: null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    closedAt: null,
    isDeleted: false,
  };
  tickets.push(ticket);
  logStatusChange(ticket, null, openStatus.id, req.user.id, 'Ticket created');
  logActivity(req.user.id, 'TicketCreated', 'Ticket', ticket.id, ticket.referenceNumber);
  res.status(201).location(`/api/tickets/${ticket.id}`).json(mapTicketDetail(ticket, req.userRoles));
});

app.put('/api/tickets/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const ticket = getTicketForUser(id, req.user);
  if (!ticket) return res.status(404).json({ message: 'Not found' });

  const { title, description, categoryId, priorityId, statusId } = req.body || {};
  if (title != null) ticket.title = title;
  if (description != null) ticket.description = description;
  if (categoryId != null) ticket.categoryId = categoryId;
  if (priorityId != null) ticket.priorityId = priorityId;

  if (statusId != null && statusId !== ticket.statusId) {
    const fromId = ticket.statusId;
    logStatusChange(ticket, fromId, statusId, req.user.id);
    notify(
      ticket.createdByUserId,
      'Status updated',
      `${ticket.referenceNumber} status changed.`,
      'StatusChange',
      ticket.id
    );
  } else {
    ticket.updatedAt = new Date().toISOString();
  }

  res.json(mapTicketDetail(ticket, req.userRoles));
});

app.delete('/api/tickets/:id', authMiddleware, requireRoles(ROLES.Admin, ROLES.Employee), (req, res) => {
  const id = Number(req.params.id);
  const ticket = getTicketForUser(id, req.user);
  if (!ticket) return res.status(404).json({ message: 'Not found' });
  if (!hasRole(req.user, ROLES.Admin) && ticket.createdByUserId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  ticket.isDeleted = true;
  ticket.updatedAt = new Date().toISOString();
  res.status(204).send();
});

app.post('/api/tickets/:id/assign', authMiddleware, requireRoles(ROLES.Admin, ROLES.Agent), (req, res) => {
  const id = Number(req.params.id);
  const ticket = getTicketForUser(id, req.user);
  if (!ticket) return res.status(404).json({ message: 'Not found' });

  const { assignedToUserId, notes, isEscalation = false } = req.body || {};
  ticket.assignedToUserId = assignedToUserId;
  ticket.updatedAt = new Date().toISOString();

  assignments.push({
    id: nextAssignmentId++,
    ticketId: id,
    assignedToUserId,
    assignedByUserId: req.user.id,
    assignedAt: new Date().toISOString(),
    notes: notes ?? null,
    isEscalation,
  });

  notify(assignedToUserId, 'Ticket assigned', `You were assigned ${ticket.referenceNumber}.`, 'Assignment', id);
  res.json({ message: 'Ticket assigned.' });
});

app.post('/api/tickets/:id/comments', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const ticket = getTicketForUser(id, req.user);
  if (!ticket) return res.status(404).json({ message: 'Not found' });

  const { body, isInternal } = req.body || {};
  if (isInternal && !hasRole(req.user, ROLES.Admin, ROLES.Agent)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  comments.push({
    id: nextCommentId++,
    ticketId: id,
    userId: req.user.id,
    body,
    isInternal: !!isInternal,
    createdAt: new Date().toISOString(),
  });

  if (ticket.createdByUserId !== req.user.id) {
    notify(ticket.createdByUserId, 'New comment', `New comment on ${ticket.referenceNumber}.`, 'Comment', id);
  }
  res.json({ message: 'Comment added.' });
});

app.post('/api/tickets/:id/attachments', authMiddleware, upload.single('file'), (req, res) => {
  const id = Number(req.params.id);
  const ticket = getTicketForUser(id, req.user);
  if (!ticket) return res.status(404).json({ message: 'Not found' });

  const file = req.file;
  if (!file || file.size === 0) return res.status(400).json({ message: 'Empty file.' });

  const allowed = ['.png', '.jpg', '.jpeg', '.pdf', '.txt', '.log'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ message: 'File type not allowed.' });
  }

  attachments.push({
    id: nextAttachmentId++,
    ticketId: id,
    uploadedByUserId: req.user.id,
    fileName: file.originalname,
    storedFileName: file.filename,
    contentType: file.mimetype,
    fileSizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
  });

  res.json({ message: 'File uploaded.', fileName: file.originalname });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────
app.get('/api/dashboard', authMiddleware, (req, res) => {
  const q = queryTicketsForUser(req.user);
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const open = q.filter((t) => getStatus(t.statusId)?.name === 'Open').length;
  const inProgress = q.filter((t) => getStatus(t.statusId)?.name === 'In Progress').length;
  const pending = q.filter((t) => getStatus(t.statusId)?.name === 'Pending').length;
  const resolvedMonth = q.filter(
    (t) => t.resolvedAt && new Date(t.resolvedAt) >= monthStart
  ).length;

  const catMap = {};
  for (const t of q) {
    const name = getCategory(t.categoryId)?.name ?? 'Unknown';
    catMap[name] = (catMap[name] || 0) + 1;
  }
  const byCategory = Object.entries(catMap).map(([category, count]) => ({ category, count }));

  const priMap = {};
  for (const t of q) {
    const name = getPriority(t.priorityId)?.name ?? 'Unknown';
    priMap[name] = (priMap[name] || 0) + 1;
  }
  const byPriority = Object.entries(priMap).map(([priority, count]) => ({ priority, count }));

  const recentTickets = q
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(mapTicketList);

  res.json({ open, inProgress, pending, resolvedMonth, byCategory, byPriority, recentTickets });
});

// ── Notifications ─────────────────────────────────────────────────────────────
app.get('/api/notifications', authMiddleware, (req, res) => {
  const items = notifications
    .filter((n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50)
    .map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      ticketId: n.ticketId,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));
  res.json(items);
});

app.post('/api/notifications/mark-all-read', authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  for (const n of notifications) {
    if (n.userId === req.user.id && !n.isRead) {
      n.isRead = true;
      n.readAt = now;
    }
  }
  res.json({ message: 'All marked as read.' });
});

app.get('/api/notifications/unread-count', authMiddleware, (req, res) => {
  const count = notifications.filter((n) => n.userId === req.user.id && !n.isRead).length;
  res.json({ count });
});

// ── Reports ───────────────────────────────────────────────────────────────────
app.get('/api/reports', authMiddleware, requireRoles(ROLES.Admin, ROLES.Manager), (req, res) => {
  const q = queryTicketsForUser(req.user);
  const totalTickets = q.length;
  const resolvedTickets = q.filter((t) => t.resolvedAt != null).length;
  const resolvedList = q.filter((t) => t.resolvedAt != null);
  const avgResolutionDays =
    resolvedList.length > 0
      ? Math.round(
          (resolvedList.reduce(
            (sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)) / 86400000,
            0
          ) /
            resolvedList.length) *
            10
        ) / 10
      : 0;

  const agentUsers = users.filter((u) => hasRole(u, ROLES.Agent));
  const agentPerformance = agentUsers.map((agent) => {
    const agentTickets = q.filter((t) => t.assignedToUserId === agent.id);
    const resolved = agentTickets.filter((t) => t.resolvedAt != null).length;
    const openCount = agentTickets.filter((t) => t.resolvedAt == null).length;
    const resolvedAgent = agentTickets.filter((t) => t.resolvedAt != null);
    const avgDays =
      resolvedAgent.length > 0
        ? Math.round(
            (resolvedAgent.reduce(
              (sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)) / 86400000,
              0
            ) /
              resolvedAgent.length) *
              10
          ) / 10
        : 0;
    return { agentName: fullName(agent), resolved, open: openCount, avgDays };
  });

  res.json({ totalTickets, resolvedTickets, avgResolutionDays, agentPerformance });
});

app.get('/api/reports/export/csv', authMiddleware, requireRoles(ROLES.Admin, ROLES.Manager), (req, res) => {
  const list = queryTicketsForUser(req.user)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 500);

  let csv = 'Reference,Title,Category,Priority,Status,Created\n';
  for (const t of list) {
    const cat = getCategory(t.categoryId)?.name ?? '';
    const pri = getPriority(t.priorityId)?.name ?? '';
    const st = getStatus(t.statusId)?.name ?? '';
    const created = t.createdAt.slice(0, 10);
    const title = `"${t.title.replace(/"/g, '""')}"`;
    csv += `${t.referenceNumber},${title},${cat},${pri},${st},${created}\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tickets-report.csv"');
  res.send(csv);
});

// ── AI ────────────────────────────────────────────────────────────────────────
app.post('/api/ai/suggest', authMiddleware, (req, res) => {
  const { title, description } = req.body || {};
  const { category, priority } = aiSuggest(title ?? '', description ?? '');
  res.json({
    suggestedCategory: category,
    suggestedPriority: priority,
    suggestedReply: aiSuggestReply(title ?? ''),
  });
});

app.post('/api/ai/chat', authMiddleware, (req, res) => {
  const { question } = req.body || {};
  res.json({ answer: aiChatAnswer(question ?? '') });
});

// ── Start ─────────────────────────────────────────────────────────────────────
await seed();
app.listen(PORT, () => {
  console.log('\n  IT Help Desk API (Node dev — full mirror of ASP.NET)');
  console.log('  http://localhost:' + PORT);
  console.log('  CORS: http://localhost:5173');
  console.log('\n  Demo accounts:');
  console.log('    admin@ithelpdesk.local   / Admin@123   (Admin)');
  console.log('    agent@ithelpdesk.local   / Agent@123   (IT Support Agent)');
  console.log('    employee@ithelpdesk.local / Employee@123 (Employee)');
  console.log('    manager@ithelpdesk.local  / Manager@123  (Manager)\n');
});
