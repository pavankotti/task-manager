require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://attractive-balance-production-88f7.up.railway.app'
  ],
  credentials: true
}));
app.use(express.json());

// ==========================================
// 1. MIDDLEWARE
// ==========================================

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

// ==========================================
// 2. AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, role, expertise } = req.body;
    
    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'MEMBER',
        expertise: expertise || 'General',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, expertise: user.expertise },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      token, 
      user: { id: user.id, email: user.email, role: user.role, expertise: user.expertise } 
    });
  } catch (error) {
    console.error('[SIGNUP ERROR]', error);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, expertise: user.expertise },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, role: user.role, expertise: user.expertise } 
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// ==========================================
// 3. PROJECT & USER MANAGEMENT ROUTES
// ==========================================

app.get('/api/users', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, expertise: true },
    });
    res.json(users);
  } catch (error) {
    console.error('[FETCH USERS ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/projects', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: { _count: { select: { tasks: true } } },
    });
    res.json(projects);
  } catch (error) {
    console.error('[FETCH PROJECTS ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const project = await prisma.project.create({
      data: { name: req.body.name, adminId: req.user.id },
    });
    res.status(201).json(project);
  } catch (error) {
    console.error('[CREATE PROJECT ERROR]', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ==========================================
// 4. CORE TASK CRUD ROUTES
// ==========================================

app.get('/api/projects/:projectId/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { order: 'asc' },
    });
    res.json(tasks);
  } catch (error) {
    console.error('[FETCH TASKS ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { title, priority, projectId, dueDate } = req.body;
    
    // Ensure tasks always start in 'Open Tasks'
    const task = await prisma.task.create({
      data: {
        title,
        status: 'Open Tasks',
        priority,
        projectId,
        order: 1,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    res.status(201).json(task);
  } catch (error) {
    console.error('[CREATE TASK ERROR]', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/reorder', authenticate, async (req, res) => {
  try {
    const { taskId, newStatus, newOrder } = req.body;
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus, order: newOrder },
    });
    res.json(updatedTask);
  } catch (error) {
    console.error('[REORDER TASK ERROR]', error);
    res.status(500).json({ error: 'Failed to reorder task' });
  }
});

app.delete('/api/tasks/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task successfully deleted' });
  } catch (error) {
    console.error('[DELETE TASK ERROR]', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ==========================================
// 5. THE WORKFLOW ENGINE (Propose -> Assign -> Review -> Complete)
// ==========================================

// Step 1: User Submits Proposal (Multiple users can bid)
app.patch('/api/tasks/:id/propose', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    // Parse existing proposals, or start a new array
    let proposals = [];
    try { 
      proposals = task.approach ? JSON.parse(task.approach) : []; 
    } catch(e) {
      console.warn('Failed to parse existing approaches, resetting to empty array.');
    }

    // Add new proposal if user hasn't bid yet
    if (!proposals.find(p => p.id === req.user.id)) {
      proposals.push({ 
        id: req.user.id, 
        email: req.user.email, 
        expertise: req.user.expertise, 
        text: req.body.approach 
      });
    }

    const updated = await prisma.task.update({ 
      where: { id: req.params.id }, 
      data: { 
        status: 'Staging', 
        approach: JSON.stringify(proposals) 
      } 
    });
    res.json(updated);
  } catch (error) {
    console.error('[PROPOSAL ERROR]', error);
    res.status(500).json({ error: 'Failed to submit proposal' });
  }
});

// Step 2a: Admin Rejects ALL Proposals
app.patch('/api/tasks/:id/reject', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { assigneeId: null, status: 'Open Tasks', approach: null },
    });
    res.json(updated);
  } catch (error) {
    console.error('[REJECT PROPOSALS ERROR]', error);
    res.status(500).json({ error: 'Failed to reject proposals' });
  }
});

// Step 2b: Admin Approves a SPECIFIC Proposal
app.patch('/api/tasks/:id/assign', authenticate, authorize(['ADMIN']), async (req, res) => {
  try { 
    const { userId, approachText } = req.body;
    const updated = await prisma.task.update({ 
      where: { id: req.params.id }, 
      data: { 
        status: 'Assigned', 
        assigneeId: userId, 
        approach: approachText // Overwrite the JSON array with the winning text
      } 
    });
    res.json(updated);
  } catch (error) {
    console.error('[ASSIGN TASK ERROR]', error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

// Step 3: User Submits Final Work
app.patch('/api/tasks/:id/submit-work', authenticate, async (req, res) => {
  try {
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { 
        remarks: req.body.remarks,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('[SUBMIT WORK ERROR]', error);
    res.status(500).json({ error: 'Failed to submit work for review' });
  }
});

// Step 4: Admin Completes Task (Triggers Broadcast)
app.patch('/api/tasks/:id/complete', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'Completed' },
    });
    res.json(updated);
  } catch (error) {
    console.error('[COMPLETE TASK ERROR]', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// ==========================================
// 6. GLOBAL BROADCAST ROUTE
// ==========================================

app.get('/api/broadcast', authenticate, async (req, res) => {
  try {
    const latest = await prisma.task.findFirst({
      where: { status: 'Completed', assigneeId: { not: null } },
      include: {
        assignee: { select: { email: true, expertise: true } },
        project: { select: { name: true } },
      },
      orderBy: { id: 'desc' },
    });
    res.json(latest);
  } catch (error) {
    console.error('[BROADCAST FETCH ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch broadcast data' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Engine running on port ${PORT}`);
});