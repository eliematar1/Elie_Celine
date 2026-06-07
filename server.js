/**
 * Dev API server — same routes as ASP.NET AuthController
 * Use when .NET SDK is not installed. Run: npm start (port 5000)
 */
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 5000;
const JWT_KEY = 'ITHelpDesk-Super-Secret-Key-Min-32-Chars-Long!!';

const roles = ['Admin', 'IT Support Agent', 'Employee', 'Manager'];
const users = [];

async function seed() {
  if (users.length) return;
  const hash = await bcrypt.hash('Admin@123', 10);
  users.push({
    id: '1',
    email: 'admin@ithelpdesk.local',
    passwordHash: hash,
    firstName: 'System',
    lastName: 'Admin',
    department: 'IT',
    roles: ['Admin'],
  });
  const hash2 = await bcrypt.hash('Employee@123', 10);
  users.push({
    id: '2',
    email: 'employee@ithelpdesk.local',
    passwordHash: hash2,
    firstName: 'Demo',
    lastName: 'Employee',
    department: 'Sales',
    roles: ['Employee'],
  });
}

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

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.slice(7), JWT_KEY);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'], credentials: true }));
app.use(express.json());

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', service: 'IT Help Desk API (Node dev)', database: 'InMemory', time: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  await seed();
  const { email, password } = req.body || {};
  const user = users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.roles }, JWT_KEY, { expiresIn: '1h' });
  res.json({ token, expiresAt, user: toProfile(user) });
});

app.post('/api/auth/register', async (req, res) => {
  await seed();
  const { email, password, firstName, lastName, department, role } = req.body || {};
  if (!roles.includes(role) && role !== 'Employee') {
    if (!['Admin', 'IT Support Agent', 'Employee', 'Manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
  }
  if (users.some((u) => u.email === email)) {
    return res.status(400).json({ message: 'Email already registered.' });
  }
  const user = {
    id: String(users.length + 1),
    email,
    passwordHash: await bcrypt.hash(password, 10),
    firstName,
    lastName,
    department: department || null,
    roles: [role || 'Employee'],
  };
  users.push(user);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.roles }, JWT_KEY, { expiresIn: '1h' });
  res.json({ token, expiresAt, user: toProfile(user) });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  await seed();
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  res.json(toProfile(user));
});

app.get('/api/auth/admin-only', authMiddleware, (req, res) => {
  const userRoles = req.user.role || [];
  const ok = userRoles.includes('Admin') || userRoles.includes('Manager');
  if (!ok) return res.status(403).json({ message: 'Forbidden' });
  res.json({ message: 'You have Admin or Manager access.' });
});

let tickets = [];
let nextTicketId = 1;

app.get('/api/tickets', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (user.roles.includes('Admin')) {
    return res.json(tickets);
  }
  const userTickets = tickets.filter(t => t.createdBy === req.user.sub);
  res.json(userTickets);
});

app.post('/api/tickets', authMiddleware, (req, res) => {
  const { title, description, category, priority } = req.body;
  const newTicket = {
    id: String(nextTicketId++),
    title,
    description,
    category: category || 'Other',
    priority: priority || 'Medium',
    status: 'Open',
    createdBy: req.user.sub,
    createdAt: new Date().toISOString()
  };
  tickets.push(newTicket);
  res.status(201).json(newTicket);
});

app.put('/api/tickets/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, description, category, priority, status } = req.body;
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  
  if (title) ticket.title = title;
  if (description) ticket.description = description;
  if (category) ticket.category = category;
  if (priority) ticket.priority = priority;
  if (status) ticket.status = status;
  
  res.json(ticket);
});

app.delete('/api/tickets/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const index = tickets.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ message: 'Ticket not found' });
  tickets.splice(index, 1);
  res.status(204).send();
});
let comments = [];
let nextCommentId = 1;

app.get('/api/tickets/:ticketId/comments', authMiddleware, (req, res) => {
  const { ticketId } = req.params;
  const ticketComments = comments.filter(c => c.ticketId === ticketId);
  res.json(ticketComments);
});

app.post('/api/tickets/:ticketId/comments', authMiddleware, (req, res) => {
  const { ticketId } = req.params;
  const { message, isInternal } = req.body;
  
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  
  const newComment = {
    id: String(nextCommentId++),
    ticketId,
    message,
    isInternal: isInternal || false,
    createdBy: req.user.sub,
    createdAt: new Date().toISOString()
  };
  comments.push(newComment);
  res.status(201).json(newComment);
});

app.delete('/api/comments/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const index = comments.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ message: 'Comment not found' });
  comments.splice(index, 1);
  res.status(204).send();
});
await seed();
app.listen(PORT, () => {
  console.log(`\n  IT Help Desk API (dev) http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Demo: admin@ithelpdesk.local / Admin@123\n`);
});
