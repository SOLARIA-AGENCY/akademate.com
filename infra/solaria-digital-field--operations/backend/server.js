const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(compression());

// Database setup
const db = new sqlite3.Database('./solaria_dfo.db');

// Initialize database tables
db.serialize(() => {
  // Projects table
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning',
    repository_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tasks table
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    assigned_agent TEXT,
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);

  // Agents table
  db.run(`CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'idle',
    capabilities TEXT,
    current_task_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_task_id) REFERENCES tasks (id)
  )`);

  // Metrics table
  db.run(`CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    metric_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  )`);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`Client ${socket.id} joined project ${projectId}`);
  });

  socket.on('task-update', (data) => {
    // Broadcast task update to all clients in the project
    io.to(`project-${data.projectId}`).emit('task-updated', data);
  });

  socket.on('agent-status', (data) => {
    // Broadcast agent status update
    io.emit('agent-status-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes

// Projects
app.get('/api/projects', (req, res) => {
  db.all("SELECT * FROM projects ORDER BY updated_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/projects', (req, res) => {
  const { name, description, repository_url } = req.body;
  
  db.run(
    "INSERT INTO projects (name, description, repository_url) VALUES (?, ?, ?)",
    [name, description, repository_url],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, description, repository_url });
    }
  );
});

app.get('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  
  db.get("SELECT * FROM projects WHERE id = ?", [projectId], (err, project) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Get project tasks
    db.all("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC", [projectId], (err, tasks) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Get project metrics
      db.all("SELECT * FROM metrics WHERE project_id = ? ORDER BY recorded_at DESC LIMIT 100", [projectId], (err, metrics) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        res.json({
          ...project,
          tasks,
          metrics
        });
      });
    });
  });
});

// Tasks
app.get('/api/tasks', (req, res) => {
  const { projectId, status, assignedAgent } = req.query;
  
  let query = "SELECT * FROM tasks WHERE 1=1";
  const params = [];
  
  if (projectId) {
    query += " AND project_id = ?";
    params.push(projectId);
  }
  
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  
  if (assignedAgent) {
    query += " AND assigned_agent = ?";
    params.push(assignedAgent);
  }
  
  query += " ORDER BY created_at DESC";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/tasks', (req, res) => {
  const { project_id, title, description, priority, assigned_agent } = req.body;
  
  db.run(
    "INSERT INTO tasks (project_id, title, description, priority, assigned_agent) VALUES (?, ?, ?, ?, ?)",
    [project_id, title, description, priority || 'medium', assigned_agent],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const newTask = {
        id: this.lastID,
        project_id,
        title,
        description,
        priority: priority || 'medium',
        assigned_agent,
        status: 'pending'
      };
      
      // Emit real-time update
      io.to(`project-${project_id}`).emit('task-created', newTask);
      
      res.json(newTask);
    }
  );
});

app.put('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const { status, assigned_agent } = req.body;
  
  db.run(
    "UPDATE tasks SET status = ?, assigned_agent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, assigned_agent, taskId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Get updated task
      db.get("SELECT * FROM tasks WHERE id = ?", [taskId], (err, task) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Emit real-time update
        io.to(`project-${task.project_id}`).emit('task-updated', task);
        
        res.json(task);
      });
    }
  );
});

// Agents
app.get('/api/agents', (req, res) => {
  db.all("SELECT * FROM agents ORDER BY created_at ASC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/agents', (req, res) => {
  const { name, type, capabilities } = req.body;
  
  db.run(
    "INSERT INTO agents (name, type, capabilities) VALUES (?, ?, ?)",
    [name, type, JSON.stringify(capabilities || [])],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const newAgent = {
        id: this.lastID,
        name,
        type,
        capabilities: capabilities || [],
        status: 'idle'
      };
      
      // Emit real-time update
      io.emit('agent-created', newAgent);
      
      res.json(newAgent);
    }
  );
});

app.put('/api/agents/:id/status', (req, res) => {
  const agentId = req.params.id;
  const { status, current_task_id } = req.body;
  
  db.run(
    "UPDATE agents SET status = ?, current_task_id = ? WHERE id = ?",
    [status, current_task_id, agentId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Get updated agent
      db.get("SELECT * FROM agents WHERE id = ?", [agentId], (err, agent) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Emit real-time update
        io.emit('agent-status-updated', agent);
        
        res.json(agent);
      });
    }
  );
});

// Metrics
app.get('/api/metrics', (req, res) => {
  const { projectId, metricType, timeRange } = req.query;
  
  let query = "SELECT * FROM metrics WHERE 1=1";
  const params = [];
  
  if (projectId) {
    query += " AND project_id = ?";
    params.push(projectId);
  }
  
  if (metricType) {
    query += " AND metric_type = ?";
    params.push(metricType);
  }
  
  if (timeRange) {
    query += " AND recorded_at >= datetime('now', '-" + timeRange + "')";
  }
  
  query += " ORDER BY recorded_at DESC LIMIT 1000";
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/metrics', (req, res) => {
  const { project_id, metric_type, value, unit } = req.body;
  
  db.run(
    "INSERT INTO metrics (project_id, metric_type, value, unit) VALUES (?, ?, ?, ?)",
    [project_id, metric_type, value, unit],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const newMetric = {
        id: this.lastID,
        project_id,
        metric_type,
        value,
        unit
      };
      
      // Emit real-time update
      io.to(`project-${project_id}`).emit('metric-updated', newMetric);
      
      res.json(newMetric);
    }
  );
});

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch all handler for frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 SOLARIA Digital Field Operations Backend running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
      process.exit(0);
    });
  });
});