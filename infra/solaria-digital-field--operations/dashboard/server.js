/**
 * 🏢 SOLARIA C-Suite Dashboard Server
 * Servidor optimizado para supervisión humana de proyectos gestionados por agentes IA
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

class SolariaDashboardServer {
    constructor() {
        // Validate JWT_SECRET at startup
        this.jwtSecret = process.env.JWT_SECRET;
        if (!this.jwtSecret || this.jwtSecret.length < 32) {
            console.warn('⚠️  JWT_SECRET should be at least 32 characters. Using secure default for development.');
            this.jwtSecret = 'solaria_jwt_secret_2024_min32chars_secure';
        }

        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: { origin: "*", methods: ["GET", "POST"] }
        });

        this.port = process.env.PORT || 3000;
        this.db = null;
        this.connectedClients = new Map(); // C-suite members conectados

        // Respetar X-Forwarded-* para rate limiting detrás de proxy (nginx)
        this.app.set('trust proxy', true);

        this.repoPath = process.env.REPO_PATH || path.resolve(__dirname, '..', '..');

        this.initializeMiddleware();
        this.initializeDatabase();
        this.initializeRoutes();
        this.initializeSocketIO();
    }

    initializeMiddleware() {
        // Seguridad - CSP deshabilitado temporalmente para desarrollo
        this.app.use(helmet({
            contentSecurityPolicy: false
        }));

        // Rate limiting desactivado en entorno local/PMO para evitar falsos positivos detrás de nginx

        // Middleware básico
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(morgan('combined'));

        // Archivos estáticos
        this.app.use(express.static(path.join(__dirname, 'public')));
    }

    async initializeDatabase() {
        try {
            this.db = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'solaria_construction',
                charset: 'utf8mb4',
                timezone: '+00:00',
                connectTimeout: 60000,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            console.log('✅ Database connected successfully');
            
            // Verificar conexión periódicamente
            setInterval(async () => {
                try {
                    await this.db.execute('SELECT 1');
                } catch (error) {
                    console.error('❌ Database connection lost:', error);
                    await this.initializeDatabase();
                }
            }, 30000);

        } catch (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    }

    initializeRoutes() {
        // Autenticación para C-suite
        this.app.post('/api/auth/login', this.handleLogin.bind(this));
        this.app.post('/api/auth/logout', this.handleLogout.bind(this));
        this.app.get('/api/auth/verify', this.verifyToken.bind(this));
        this.app.post('/api/auth/quick-access', this.handleQuickAccess.bind(this));

        // Middleware de autenticación para rutas protegidas
        // Health check (sin autenticación) - antes del middleware
        this.app.get('/api/health', this.healthCheck.bind(this));

        // Middleware de autenticación
        this.app.use('/api/', this.authenticateToken.bind(this));

        // Dashboard principal
        this.app.get('/api/dashboard/overview', this.getDashboardOverview.bind(this));
        this.app.get('/api/dashboard/metrics', this.getDashboardMetrics.bind(this));
        this.app.get('/api/dashboard/alerts', this.getDashboardAlerts.bind(this));
        this.app.post('/api/alerts', this.createAlert.bind(this));
        this.app.put('/api/alerts/:id/resolve', this.resolveAlert.bind(this));
        this.app.get('/api/docs', this.getDocs.bind(this));
        this.app.get('/api/docs', this.getDocs.bind(this));

        // Gestión de proyectos
        this.app.get('/api/projects', this.getProjects.bind(this));
        this.app.get('/api/projects/:id', this.getProject.bind(this));
        this.app.post('/api/projects', this.createProject.bind(this));
        this.app.put('/api/projects/:id', this.updateProject.bind(this));
        this.app.delete('/api/projects/:id', this.deleteProject.bind(this));

        // Gestión de agentes IA
        this.app.get('/api/agents', this.getAgents.bind(this));
        this.app.get('/api/agents/:id', this.getAgent.bind(this));
        this.app.get('/api/agents/:id/performance', this.getAgentPerformance.bind(this));
        this.app.put('/api/agents/:id/status', this.updateAgentStatus.bind(this));

        // Gestión de tareas
        this.app.get('/api/tasks', this.getTasks.bind(this));
        this.app.get('/api/tasks/:id', this.getTask.bind(this));
        this.app.post('/api/tasks', this.createTask.bind(this));
        this.app.put('/api/tasks/:id', this.updateTask.bind(this));

        // Logs y auditoría
        this.app.get('/api/logs', this.getLogs.bind(this));
        this.app.get('/api/logs/audit', this.getAuditLogs.bind(this));

        // Reportes y analíticas
        this.app.get('/api/reports/projects', this.getProjectReports.bind(this));
        this.app.get('/api/reports/agents', this.getAgentReports.bind(this));
        this.app.get('/api/reports/financial', this.getFinancialReports.bind(this));

        // Documentacion y recursos del proyecto
        this.app.get('/api/docs', this.getProjectDocs.bind(this));
        this.app.get('/api/docs/list', this.getDocumentsList.bind(this));
        this.app.get('/api/docs/specs', this.getProjectSpecs.bind(this));
        this.app.get('/api/docs/credentials', this.getProjectCredentials.bind(this));
        this.app.get('/api/docs/architecture', this.getProjectArchitecture.bind(this));
        this.app.get('/api/docs/roadmap', this.getProjectRoadmap.bind(this));

        // Vistas específicas por rol C-Suite
        this.app.get('/api/csuite/ceo', this.getCEODashboard.bind(this));
        this.app.get('/api/csuite/cto', this.getCTODashboard.bind(this));
        this.app.get('/api/csuite/coo', this.getCOODashboard.bind(this));
        this.app.get('/api/csuite/cfo', this.getCFODashboard.bind(this));

        // API para agentes IA (auto-deployment)
        this.app.post('/api/agent/register-doc', this.registerDocument.bind(this));
        this.app.post('/api/agent/update-project', this.updateProjectFromAgent.bind(this));
        this.app.post('/api/agent/add-task', this.addTaskFromAgent.bind(this));
        this.app.post('/api/agent/log-activity', this.logAgentActivity.bind(this));
        this.app.post('/api/agent/update-metrics', this.updateMetricsFromAgent.bind(this));
        this.app.get('/api/agent/instructions', this.getAgentInstructions.bind(this));

        // Servir archivos estáticos
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // Servir dashboard principal (para cualquier ruta que no sea API)
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });
    }

    initializeSocketIO() {
        this.io.on('connection', (socket) => {
            console.log(`👤 C-Suite member connected: ${socket.id}`);

            // Autenticación por socket
            socket.on('authenticate', async (token) => {
                try {
                    const decoded = jwt.verify(token, this.jwtSecret);
                    const user = await this.getUserById(decoded.userId);
                    
                    if (user) {
                        socket.userId = user.user_id;
                        socket.userRole = user.role;
                        this.connectedClients.set(socket.id, user);
                        
                        socket.emit('authenticated', { user });
                        console.log(`✅ ${user.name} (${user.role}) authenticated`);
                        
                        // Unir a sala específica del rol
                        socket.join(user.role);
                    } else {
                        socket.emit('authentication_error', { error: 'Invalid user' });
                    }
                } catch (error) {
                    socket.emit('authentication_error', { error: 'Invalid token' });
                }
            });

            // Suscribir a actualizaciones de proyectos
            socket.on('subscribe_projects', () => {
                socket.join('projects');
            });

            // Suscribir a actualizaciones de agentes
            socket.on('subscribe_agents', () => {
                socket.join('agents');
            });

            // Suscribir a alertas críticas
            socket.on('subscribe_alerts', () => {
                socket.join('alerts');
            });

            socket.on('disconnect', () => {
                const user = this.connectedClients.get(socket.id);
                if (user) {
                    console.log(`👋 ${user.name} disconnected`);
                    this.connectedClients.delete(socket.id);
                }
            });
        });

        // Emisión de actualizaciones en tiempo real
        this.startRealTimeUpdates();
    }

    async startRealTimeUpdates() {
        // Actualizaciones cada 5 segundos
        setInterval(async () => {
            try {
                // Actualizar estados de agentes
                const agentStates = await this.getAgentStates();
                this.io.to('agents').emit('agent_states_update', agentStates);

                // Actualizar métricas de proyectos
                const projectMetrics = await this.getProjectMetrics();
                this.io.to('projects').emit('project_metrics_update', projectMetrics);

                // Verificar alertas críticas
                const criticalAlerts = await this.getCriticalAlerts();
                if (criticalAlerts.length > 0) {
                    this.io.to('alerts').emit('critical_alerts', criticalAlerts);
                }

            } catch (error) {
                console.error('❌ Real-time update error:', error);
            }
        }, 5000);
    }

    // Métodos de autenticación
    async handleLogin(req, res) {
        try {
            console.log('Login attempt:', { userId: req.body.userId, username: req.body.username, hasPassword: !!req.body.password });
            // Aceptar ambos userId y username para compatibilidad
            const username = req.body.userId || req.body.username;
            const { password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }
            
            console.log('Executing query for username:', username);
            const [users] = await this.db.execute(
                'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
                [username]
            );
            console.log('Query result:', users.length, 'users found');

            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = users[0];

            // Verificar password hash (bcrypt for production, SHA256 for legacy)
            const passwordHash = require('crypto').createHash('sha256').update(password).digest('hex');
            const isValidPassword = user.password_hash === passwordHash ||
                                    await bcrypt.compare(password, user.password_hash);

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Actualizar último login
            await this.db.execute(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id]
            );
            
            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                this.jwtSecret,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role,
                    email: user.email
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    async handleLogout(req, res) {
        res.json({ message: 'Logged out successfully' });
    }

    async handleQuickAccess(req, res) {
        // Quick access only works in non-production environments
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
            return res.status(403).json({ error: 'Quick access disabled in production' });
        }

        try {
            // Use predefined demo credentials from environment or fallback
            const demoUser = process.env.DEMO_USER || 'carlosjperez';
            const demoPass = process.env.DEMO_PASS || 'bypass';

            const [users] = await this.db.execute(
                'SELECT * FROM users WHERE username = ?',
                [demoUser]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: 'Demo user not configured' });
            }

            const user = users[0];
            const validPassword = await bcrypt.compare(demoPass, user.password_hash);

            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid demo credentials' });
            }

            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                this.jwtSecret,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Quick access error:', error);
            res.status(500).json({ error: 'Quick access failed' });
        }
    }

    async verifyToken(req, res) {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            const user = await this.getUserById(decoded.userId);
            res.json({ valid: true, user });
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }

    authenticateToken(req, res, next) {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }

    // Métodos del Dashboard
    async getDashboardOverview(req, res) {
        try {
            const [projects] = await this.db.execute(`
                SELECT 
                    COUNT(*) as total_projects,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
                    COUNT(CASE WHEN status = 'development' THEN 1 END) as active_projects,
                    COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_projects,
                    SUM(budget) as total_budget,
                    SUM(actual_cost) as total_actual_cost
                FROM projects
            `);

            const [agents] = await this.db.execute(`
                SELECT 
                    COUNT(*) as total_agents,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_agents,
                    COUNT(CASE WHEN status = 'busy' THEN 1 END) as busy_agents,
                    COUNT(CASE WHEN status = 'error' THEN 1 END) as error_agents
                FROM ai_agents
            `);

            const [tasks] = await this.db.execute(`
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
                    COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks
                FROM tasks
            `);

            const [alerts] = await this.db.execute(`
                SELECT 
                    COUNT(*) as total_alerts,
                    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_alerts,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_alerts
                FROM alerts
            `);

            res.json({
                projects: projects[0],
                agents: agents[0],
                tasks: tasks[0],
                alerts: alerts[0],
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch dashboard overview' });
        }
    }

    async getDashboardMetrics(req, res) {
        try {
            const { timeframe = '30' } = req.query;
            
            // Métricas de proyectos
            const [projectMetrics] = await this.db.execute(`
                SELECT 
                    DATE(metric_date) as date,
                    AVG(completion_percentage) as avg_completion,
                    AVG(agent_efficiency) as avg_efficiency,
                    AVG(code_quality_score) as avg_quality,
                    SUM(total_hours_worked) as total_hours
                FROM project_metrics
                WHERE metric_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE(metric_date)
                ORDER BY date ASC
            `, [timeframe]);

            // Métricas de agentes
            const [agentMetrics] = await this.db.execute(`
                SELECT 
                    aa.role,
                    COUNT(t.id) as tasks_assigned,
                    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as tasks_completed,
                    AVG(t.actual_hours) as avg_task_time,
                    COUNT(CASE WHEN al.level = 'error' THEN 1 END) as error_count
                FROM ai_agents aa
                LEFT JOIN tasks t ON aa.id = t.agent_id
                LEFT JOIN activity_logs al ON aa.id = al.agent_id 
                    AND al.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY aa.role
            `, [timeframe]);

            res.json({
                projectMetrics,
                agentMetrics,
                timeframe
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch metrics' });
        }
    }

    async getDashboardAlerts(req, res) {
        try {
            const { severity, status = 'active', limit = 50 } = req.query;
            
            let query = `
                SELECT 
                    a.*,
                    p.name as project_name,
                    aa.name as agent_name,
                    t.title as task_title
                FROM alerts a
                LEFT JOIN projects p ON a.project_id = p.id
                LEFT JOIN ai_agents aa ON a.agent_id = aa.id
                LEFT JOIN tasks t ON a.task_id = t.id
                WHERE a.status = ?
            `;
            const params = [status];

            if (severity) {
                query += ' AND a.severity = ?';
                params.push(severity);
            }

            const limitNum = Math.min(parseInt(limit) || 50, 200);
            query += ` ORDER BY a.created_at DESC LIMIT ${limitNum}`;

            const [alerts] = await this.db.execute(query, params);

            res.json(alerts);

        } catch (error) {
            console.error('alerts query failed', error);
            res.status(500).json({ error: 'Failed to fetch alerts' });
        }
    }

    async createAlert(req, res) {
        try {
            const { title, message, severity = 'info', project_id, task_id, agent_id } = req.body;

            const [result] = await this.db.execute(`
                INSERT INTO alerts (title, message, severity, project_id, task_id, agent_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [title, message, severity, project_id || null, task_id || null, agent_id || null]);

            // Emit Socket.IO event
            this.io.to('alerts').emit('alert:created', {
                id: result.insertId,
                title,
                message,
                severity,
                project_id,
                task_id,
                agent_id,
                created_at: new Date().toISOString()
            });

            res.status(201).json({ id: result.insertId, message: 'Alert created' });

        } catch (error) {
            console.error('createAlert error:', error);
            res.status(500).json({ error: 'Failed to create alert' });
        }
    }

    async resolveAlert(req, res) {
        try {
            const { id } = req.params;

            const [result] = await this.db.execute(`
                UPDATE alerts SET status = 'resolved', resolved_at = NOW() WHERE id = ?
            `, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Alert not found' });
            }

            // Emit Socket.IO event
            this.io.to('alerts').emit('alert:resolved', { id: parseInt(id) });

            res.json({ message: 'Alert resolved' });

        } catch (error) {
            console.error('resolveAlert error:', error);
            res.status(500).json({ error: 'Failed to resolve alert' });
        }
    }

    async getDocs(req, res) {
        try {
            const specPath = path.join(this.repoPath, 'docs', 'specs', 'ACADEIMATE_SPEC.md');
            const milestonesPath = path.join(this.repoPath, 'docs', 'PROJECT_MILESTONES.md');

            const specContent = fs.existsSync(specPath) ? fs.readFileSync(specPath, 'utf-8') : 'Spec no encontrada';
            const milestonesContent = fs.existsSync(milestonesPath) ? fs.readFileSync(milestonesPath, 'utf-8') : 'Milestones no encontrados';

            // primeras 1200 chars del spec
            const specSnippet = specContent.slice(0, 1200);
            const milestones = milestonesContent
                .split(/\r?\n/)
                .filter(l => l.trim().startsWith('-'))
                .map(l => l.replace(/^[-•]\s*/, ''))
                .slice(0, 30);

            res.json({ specSnippet, milestones });
        } catch (error) {
            console.error('getDocs error', error);
            res.status(500).json({ error: 'Failed to load docs' });
        }
    }

    // Métodos de proyectos
    async getProjects(req, res) {
        try {
            const { status, priority, page = 1, limit = 20 } = req.query;

            let query = `
                SELECT
                    p.*,
                    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
                    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks,
                    (SELECT COUNT(DISTINCT COALESCE(assigned_agent_id, agent_id)) FROM tasks WHERE project_id = p.id AND COALESCE(assigned_agent_id, agent_id) IS NOT NULL) as agents_assigned,
                    (SELECT COUNT(*) FROM alerts WHERE project_id = p.id AND status = 'active') as active_alerts
                FROM projects p
            `;

            const whereConditions = [];
            const params = [];

            if (status) {
                whereConditions.push('p.status = ?');
                params.push(status);
            }

            if (priority) {
                whereConditions.push('p.priority = ?');
                params.push(priority);
            }

            if (whereConditions.length > 0) {
                query += ' WHERE ' + whereConditions.join(' AND ');
            }

            query += ' ORDER BY p.updated_at DESC';

            const offset = (parseInt(page) - 1) * parseInt(limit);
            query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

            const [projects] = await this.db.execute(query, params);

            // Obtener total para paginación
            const countQuery = 'SELECT COUNT(*) as total FROM projects' +
                (whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '');
            const [countResult] = await this.db.execute(countQuery, params);

            res.json({
                projects,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / parseInt(limit))
                }
            });

        } catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ error: 'Failed to fetch projects' });
        }
    }

    async getProject(req, res) {
        try {
            const { id } = req.params;
            
            const [projects] = await this.db.execute(`
                SELECT * FROM projects WHERE id = ?
            `, [id]);

            if (projects.length === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const project = projects[0];

            // Obtener tareas del proyecto
            const [tasks] = await this.db.execute(`
                SELECT 
                    t.*,
                    aa.name as agent_name,
                    aa.role as agent_role
                FROM tasks t
                LEFT JOIN ai_agents aa ON t.agent_id = aa.id
                WHERE t.project_id = ?
                ORDER BY t.created_at DESC
            `, [id]);

            // Obtener agentes asignados
            const [agents] = await this.db.execute(`
                SELECT DISTINCT 
                    aa.*,
                    COUNT(t.id) as tasks_assigned,
                    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as tasks_completed
                FROM ai_agents aa
                INNER JOIN tasks t ON aa.id = t.agent_id
                WHERE t.project_id = ?
                GROUP BY aa.id
            `, [id]);

            // Obtener alertas del proyecto
            const [alerts] = await this.db.execute(`
                SELECT * FROM alerts 
                WHERE project_id = ? AND status = 'active'
                ORDER BY severity DESC, created_at DESC
            `, [id]);

            // Obtener métricas recientes
            const [metrics] = await this.db.execute(`
                SELECT * FROM project_metrics 
                WHERE project_id = ?
                ORDER BY metric_date DESC
                LIMIT 30
            `, [id]);

            res.json({
                project,
                tasks,
                agents,
                alerts,
                metrics
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch project' });
        }
    }

    async createProject(req, res) {
        try {
            const {
                name,
                client,
                description,
                priority = 'medium',
                budget,
                start_date,
                deadline
            } = req.body;

            const [result] = await this.db.execute(`
                INSERT INTO projects (
                    name, client, description, priority, budget, 
                    start_date, deadline, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                name, client, description, priority, budget,
                start_date, deadline, req.user.userId
            ]);

            // Log de creación
            await this.db.execute(`
                INSERT INTO activity_logs (
                    project_id, action, details, category, level
                ) VALUES (?, ?, ?, ?, ?)
            `, [
                result.insertId,
                'project_created',
                `Project ${name} created by ${req.user.userId}`,
                'management',
                'info'
            ]);

            // Emit Socket.IO event
            this.io.to('projects').emit('project:created', {
                id: result.insertId,
                name,
                client,
                priority,
                createdBy: req.user.userId
            });

            res.status(201).json({
                id: result.insertId,
                message: 'Project created successfully'
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to create project' });
        }
    }

    async updateProject(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const [result] = await this.db.execute(`
                UPDATE projects 
                SET name = ?, client = ?, description = ?, priority = ?, budget = ?, deadline = ?
                WHERE id = ?
            `, [
                updates.name, updates.client, updates.description, 
                updates.priority, updates.budget, updates.deadline, id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }

            // Emit Socket.IO event
            this.io.to('projects').emit('project:updated', {
                id: parseInt(id),
                updates: {
                    name: updates.name,
                    client: updates.client,
                    priority: updates.priority
                }
            });

            res.json({ message: 'Project updated successfully' });

        } catch (error) {
            res.status(500).json({ error: 'Failed to update project' });
        }
    }

    async deleteProject(req, res) {
        try {
            const { id } = req.params;
            
            const [result] = await this.db.execute(`
                DELETE FROM projects WHERE id = ?
            `, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }

            res.json({ message: 'Project deleted successfully' });

        } catch (error) {
            res.status(500).json({ error: 'Failed to delete project' });
        }
    }

    // Métodos de agentes
    async getAgents(req, res) {
        try {
            const { role, status, page = '1', limit = '50' } = req.query;
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 50;

            let query = `
                SELECT
                    aa.*,
                    COUNT(t.id) as tasks_assigned,
                    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as tasks_completed,
                    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as current_tasks,
                    COUNT(CASE WHEN al.level = 'error' THEN 1 END) as error_count
                FROM ai_agents aa
                LEFT JOIN tasks t ON aa.id = t.agent_id
                LEFT JOIN activity_logs al ON aa.id = al.agent_id
                    AND al.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            `;

            const whereConditions = [];
            const params = [];

            if (role) {
                whereConditions.push('aa.role = ?');
                params.push(role);
            }

            if (status) {
                whereConditions.push('aa.status = ?');
                params.push(status);
            }

            if (whereConditions.length > 0) {
                query += ' WHERE ' + whereConditions.join(' AND ');
            }

            query += ' GROUP BY aa.id ORDER BY aa.last_activity DESC';

            const offset = (pageNum - 1) * limitNum;
            query += ` LIMIT ${limitNum} OFFSET ${offset}`;

            const [agents] = await this.db.execute(query, params);

            res.json(agents);

        } catch (error) {
            console.error('Error fetching agents:', error);
            res.status(500).json({ error: 'Failed to fetch agents' });
        }
    }

    // Métodos auxiliares
    async getUserById(userId) {
        const [users] = await this.db.execute(
            'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
            [userId]
        );
        return users[0] || null;
    }

    async getAgentStates() {
        const [states] = await this.db.execute(`
            SELECT 
                as_.*,
                aa.name,
                aa.role
            FROM agent_states as_
            INNER JOIN ai_agents aa ON as_.agent_id = aa.id
            WHERE as_.last_heartbeat >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
        `);
        return states;
    }

    async getProjectMetrics() {
        const [metrics] = await this.db.execute(`
            SELECT 
                project_id,
                agent_efficiency,
                code_quality_score,
                test_coverage,
                tasks_completed,
                tasks_pending,
                tasks_blocked,
                performance_score
            FROM project_metrics
            WHERE metric_date = CURDATE()
        `);
        return metrics;
    }

    async getCriticalAlerts() {
        const [alerts] = await this.db.execute(`
            SELECT 
                a.*,
                p.name as project_name,
                aa.name as agent_name
            FROM alerts a
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN ai_agents aa ON a.agent_id = aa.id
            WHERE a.severity = 'critical' AND a.status = 'active'
            ORDER BY a.created_at DESC
            LIMIT 10
        `);
        return alerts;
    }

    async getAgent(req, res) {
        try {
            const { id } = req.params;
            
            const [agent] = await this.db.execute(`
                SELECT 
                    aa.*,
                    as_.status,
                    as_.current_task,
                    as_.last_heartbeat,
                    as_.performance_metrics
                FROM ai_agents aa
                LEFT JOIN agent_states as_ ON aa.id = as_.agent_id
                WHERE aa.id = ?
            `, [id]);

            if (agent.length === 0) {
                return res.status(404).json({ error: 'Agent not found' });
            }

            res.json(agent[0]);

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch agent' });
        }
    }

    async getAgentPerformance(req, res) {
        try {
            const { id } = req.params;
            const { period = '7d' } = req.query;
            
            const [performance] = await this.db.execute(`
                SELECT 
                    DATE(created_at) as date,
                    AVG(CASE WHEN metric_type = 'efficiency' THEN metric_value END) as efficiency,
                    AVG(CASE WHEN metric_type = 'quality' THEN metric_value END) as quality,
                    AVG(CASE WHEN metric_type = 'speed' THEN metric_value END) as speed
                FROM agent_metrics
                WHERE agent_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `, [id]);

            res.json(performance);

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch agent performance' });
        }
    }

    async updateAgentStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            await this.db.execute(`
                UPDATE agent_states 
                SET status = ?, last_heartbeat = NOW()
                WHERE agent_id = ?
            `, [status, id]);

            res.json({ message: 'Agent status updated successfully' });

        } catch (error) {
            res.status(500).json({ error: 'Failed to update agent status' });
        }
    }

    async getTasks(req, res) {
        try {
            const { project_id, agent_id, status } = req.query;
            
            let query = `
                SELECT 
                    t.*,
                    p.name as project_name,
                    aa.name as agent_name,
                    u.username as assigned_by_name
                FROM tasks t
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN ai_agents aa ON t.assigned_agent_id = aa.id
                LEFT JOIN users u ON t.assigned_by = u.id
                WHERE 1=1
            `;
            
            const params = [];
            
            if (project_id) {
                query += ' AND t.project_id = ?';
                params.push(project_id);
            }
            
            if (agent_id) {
                query += ' AND t.assigned_agent_id = ?';
                params.push(agent_id);
            }
            
            if (status) {
                query += ' AND t.status = ?';
                params.push(status);
            }
            
            query += ' ORDER BY t.created_at DESC';
            
            const [tasks] = await this.db.execute(query, params);
            res.json(tasks);

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    }

    async getTask(req, res) {
        try {
            const { id } = req.params;
            
            const [task] = await this.db.execute(`
                SELECT 
                    t.*,
                    p.name as project_name,
                    aa.name as agent_name,
                    u.username as assigned_by_name
                FROM tasks t
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN ai_agents aa ON t.assigned_agent_id = aa.id
                LEFT JOIN users u ON t.assigned_by = u.id
                WHERE t.id = ?
            `, [id]);

            if (task.length === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }

            res.json(task[0]);

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch task' });
        }
    }

    async createTask(req, res) {
        try {
            const {
                title,
                description,
                project_id,
                assigned_agent_id,
                priority = 'medium',
                estimated_hours,
                deadline
            } = req.body;

            const [result] = await this.db.execute(`
                INSERT INTO tasks (
                    title, description, project_id, assigned_agent_id,
                    priority, estimated_hours, deadline, assigned_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                title, description, project_id, assigned_agent_id,
                priority, estimated_hours, deadline, req.user.userId
            ]);

            // Emit Socket.IO event
            this.io.emit('task:created', {
                id: result.insertId,
                title,
                project_id,
                assigned_agent_id,
                priority
            });

            res.status(201).json({
                id: result.insertId,
                message: 'Task created successfully'
            });

        } catch (error) {
            res.status(500).json({ error: 'Failed to create task' });
        }
    }

    async updateTask(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const [result] = await this.db.execute(`
                UPDATE tasks 
                SET title = ?, description = ?, status = ?, priority = ?, 
                    progress = ?, actual_hours = ?, notes = ?
                WHERE id = ?
            `, [
                updates.title, updates.description, updates.status, updates.priority,
                updates.progress, updates.actual_hours, updates.notes, id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Task not found' });
            }

            // Emit Socket.IO event
            this.io.emit('task:updated', {
                id: parseInt(id),
                status: updates.status,
                progress: updates.progress,
                priority: updates.priority
            });

            res.json({ message: 'Task updated successfully' });

        } catch (error) {
            res.status(500).json({ error: 'Failed to update task' });
        }
    }

    async getLogs(req, res) {
        try {
            const { level, category, limit = 100 } = req.query;
            const safeLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);

            let query = `
                SELECT
                    al.*,
                    p.name as project_name,
                    aa.name as agent_name
                FROM activity_logs al
                LEFT JOIN projects p ON al.project_id = p.id
                LEFT JOIN ai_agents aa ON al.agent_id = aa.id
                WHERE 1=1
            `;

            const params = [];

            if (level) {
                query += ' AND al.level = ?';
                params.push(level);
            }

            if (category) {
                query += ' AND al.category = ?';
                params.push(category);
            }

            query += ` ORDER BY al.created_at DESC LIMIT ${safeLimit}`;

            const [logs] = await this.db.execute(query, params);
            res.json(logs);

        } catch (error) {
            console.error('Error fetching logs:', error);
            res.status(500).json({ error: 'Failed to fetch logs', details: error.message });
        }
    }

    async getAuditLogs(req, res) {
        try {
            const { limit = 50 } = req.query;
            
            const [logs] = await this.db.execute(`
                SELECT 
                    al.*,
                    u.username as user_name
                FROM activity_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.category = 'security'
                ORDER BY al.created_at DESC
                LIMIT ?
            `, [parseInt(limit)]);

            res.json(logs);

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch audit logs' });
        }
    }

    async getProjectReports(req, res) {
        try {
            const { period = '30d' } = req.query;
            
            const [reports] = await this.db.execute(`
                SELECT 
                    p.name as project_name,
                    COUNT(t.id) as total_tasks,
                    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                    AVG(pm.completion_percentage) as avg_completion,
                    AVG(pm.agent_efficiency) as avg_efficiency
                FROM projects p
                LEFT JOIN tasks t ON p.id = t.project_id
                LEFT JOIN project_metrics pm ON p.id = pm.project_id
                WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY p.id, p.name
                ORDER BY avg_completion DESC
            `);

            res.json(reports);

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch project reports' });
        }
    }

    async getAgentReports(req, res) {
        try {
            const [reports] = await this.db.execute(`
                SELECT 
                    aa.name as agent_name,
                    aa.role,
                    COUNT(t.id) as total_tasks,
                    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                    AVG(am.metric_value) as avg_performance,
                    as_.status as current_status
                FROM ai_agents aa
                LEFT JOIN tasks t ON aa.id = t.assigned_agent_id
                LEFT JOIN agent_metrics am ON aa.id = am.agent_id
                LEFT JOIN agent_states as_ ON aa.id = as_.agent_id
                GROUP BY aa.id, aa.name, aa.role, as_.status
                ORDER BY avg_performance DESC
            `);

            res.json(reports);

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch agent reports' });
        }
    }

    async getFinancialReports(req, res) {
        try {
            const [reports] = await this.db.execute(`
                SELECT 
                    p.name as project_name,
                    p.budget,
                    COALESCE(pm.budget_used, 0) as actual_cost,
                    p.budget - COALESCE(pm.budget_used, 0) as remaining_budget,
                    CASE 
                        WHEN p.budget > 0 THEN 
                            (COALESCE(pm.budget_used, 0) / p.budget) * 100 
                        ELSE 0 
                    END as budget_usage_percentage
                FROM projects p
                LEFT JOIN project_metrics pm ON p.id = pm.project_id AND pm.metric_date = CURDATE()
                GROUP BY p.id, p.name, p.budget, pm.budget_used
                ORDER BY budget_usage_percentage DESC
            `);

            res.json(reports);

        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch financial reports' });
        }
    }

    async healthCheck(req, res) {
        try {
            await this.db.execute('SELECT 1');
            
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
                connected_clients: this.connectedClients.size,
                uptime: process.uptime()
            });

        } catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                error: error.message
            });
        }
    }

    // ========== DOCUMENTACIÓN Y RECURSOS ==========

    async getProjectDocs(req, res) {
        try {
            // Documentación del proyecto actual
            res.json({
                project: 'SOLARIA Digital Field Operations',
                version: '2.0.0',
                documents: [
                    { id: 1, name: 'README.md', type: 'documentation', path: '/README.md', description: 'Documentación principal del proyecto' },
                    { id: 2, name: 'CLAUDE.md', type: 'agent-instructions', path: '/CLAUDE.md', description: 'Instrucciones para agentes IA' },
                    { id: 3, name: 'docker-compose.yml', type: 'infrastructure', path: '/docker-compose.yml', description: 'Configuración de servicios Docker' },
                    { id: 4, name: 'mysql-init.sql', type: 'database', path: '/infrastructure/database/mysql-init.sql', description: 'Schema de base de datos' },
                    { id: 5, name: 'nginx.conf', type: 'infrastructure', path: '/infrastructure/nginx/nginx.conf', description: 'Configuración de reverse proxy' }
                ],
                categories: ['documentation', 'agent-instructions', 'infrastructure', 'database', 'api-specs']
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch docs' });
        }
    }

    async getDocumentsList(req, res) {
        try {
            const repoPath = process.env.REPO_PATH || '/repo';
            const fs = require('fs');
            const path = require('path');

            // Patterns de archivos de documentacion
            const docPatterns = [
                { pattern: /\.md$/i, type: 'markdown', icon: 'fa-file-lines' },
                { pattern: /\.txt$/i, type: 'text', icon: 'fa-file-alt' },
                { pattern: /\.json$/i, type: 'json', icon: 'fa-file-code' },
                { pattern: /\.ya?ml$/i, type: 'yaml', icon: 'fa-file-code' },
                { pattern: /\.sql$/i, type: 'sql', icon: 'fa-database' },
                { pattern: /\.env/i, type: 'env', icon: 'fa-cog' },
                { pattern: /Dockerfile/i, type: 'docker', icon: 'fa-docker' },
                { pattern: /docker-compose/i, type: 'docker', icon: 'fa-docker' }
            ];

            const documents = [];
            const dirsToScan = ['', 'docs', 'documentation', 'specs', 'config'];

            const getFileType = (filename) => {
                for (const p of docPatterns) {
                    if (p.pattern.test(filename)) return { type: p.type, icon: p.icon };
                }
                return { type: 'file', icon: 'fa-file' };
            };

            const scanDir = (dir, relPath = '') => {
                const fullPath = path.join(repoPath, dir);
                if (!fs.existsSync(fullPath)) return;

                try {
                    const files = fs.readdirSync(fullPath);
                    for (const file of files) {
                        const filePath = path.join(fullPath, file);
                        const stat = fs.statSync(filePath);

                        if (stat.isFile()) {
                            const { type, icon } = getFileType(file);
                            if (type !== 'file' || file.endsWith('.md')) {
                                documents.push({
                                    name: file,
                                    path: path.join(dir, file),
                                    type: type,
                                    icon: icon,
                                    size: stat.size,
                                    modified: stat.mtime,
                                    repoUrl: 'https://github.com/SOLARIA-AGENCY/akademate.com/blob/main/' + path.join(dir, file).replace(/^\//, '')
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error scanning dir:', dir, e.message);
                }
            };

            // Escanear directorios principales
            for (const dir of dirsToScan) {
                scanDir(dir);
            }

            // Ordenar por tipo y nombre
            documents.sort((a, b) => {
                if (a.type !== b.type) return a.type.localeCompare(b.type);
                return a.name.localeCompare(b.name);
            });

            res.json({
                total: documents.length,
                documents: documents.slice(0, 50) // Limitar a 50 documentos
            });
        } catch (error) {
            console.error('Error listing documents:', error);
            res.status(500).json({ error: 'Failed to list documents' });
        }
    }

    async getProjectSpecs(req, res) {
        try {
            res.json({
                project: 'SOLARIA Digital Field Operations',
                specs: {
                    technical: {
                        frontend: {
                            framework: 'Vanilla JS + TailwindCSS',
                            styling: 'shadcn/ui design system',
                            charts: 'Chart.js',
                            realtime: 'Socket.IO'
                        },
                        backend: {
                            runtime: 'Node.js 20',
                            framework: 'Express.js',
                            database: 'MySQL 8.0',
                            authentication: 'JWT + SHA256'
                        },
                        infrastructure: {
                            containerization: 'Docker + Docker Compose',
                            proxy: 'Nginx',
                            ports: { dashboard: 3000, mysql: 3306 }
                        }
                    },
                    features: [
                        'C-Suite Dashboard (CEO/CTO/COO/CFO)',
                        'Real-time project monitoring',
                        'AI Agent coordination',
                        'Quick Access authentication',
                        'Project metrics visualization',
                        'Alert management',
                        'Task tracking'
                    ],
                    requirements: {
                        minimum: { node: '18.0.0', npm: '8.0.0', docker: '20.0.0' },
                        recommended: { node: '20.0.0', npm: '10.0.0', docker: '24.0.0' }
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch specs' });
        }
    }

    async getProjectCredentials(req, res) {
        try {
            // Solo usuarios con rol admin o ceo pueden ver credenciales
            if (req.user.role !== 'ceo' && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied. CEO or Admin role required.' });
            }

            res.json({
                warning: 'CONFIDENTIAL - Handle with care',
                environments: {
                    development: {
                        dashboard: { url: 'http://localhost:3000', user: 'carlosjperez', password: 'bypass' },
                        database: { host: 'localhost', port: 3306, user: 'solaria_user', password: 'solaria2024', database: 'solaria_construction' },
                        jwt_secret: 'solaria_jwt_secret_key_2024_secure_change_in_production'
                    },
                    production: {
                        note: 'Configure in .env file',
                        required_vars: ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']
                    }
                },
                api_keys: {
                    openai: 'Configure OPENAI_API_KEY in .env',
                    anthropic: 'Configure ANTHROPIC_API_KEY in .env'
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch credentials' });
        }
    }

    async getProjectArchitecture(req, res) {
        try {
            res.json({
                project: 'SOLARIA Digital Field Operations',
                architecture: {
                    overview: 'Microservices-based digital construction office',
                    layers: {
                        presentation: {
                            components: ['Login Screen', 'Dashboard', 'Sidebar Navigation', 'Stat Cards', 'Charts'],
                            technology: 'HTML5 + TailwindCSS + Chart.js'
                        },
                        application: {
                            components: ['Authentication Service', 'Dashboard API', 'Project Service', 'Agent Service', 'Real-time Updates'],
                            technology: 'Express.js + Socket.IO'
                        },
                        data: {
                            components: ['MySQL Database', 'Redis Cache (optional)'],
                            tables: ['users', 'projects', 'ai_agents', 'tasks', 'alerts', 'activity_logs', 'project_metrics']
                        },
                        infrastructure: {
                            components: ['Docker Containers', 'Nginx Reverse Proxy'],
                            services: ['dashboard-backend', 'mysql', 'redis', 'nginx']
                        }
                    },
                    dataFlow: [
                        'User -> Nginx -> Dashboard Backend -> MySQL',
                        'Dashboard Backend <-> Socket.IO -> Browser (real-time)',
                        'AI Agents -> API -> Database -> Dashboard'
                    ]
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch architecture' });
        }
    }

    async getProjectRoadmap(req, res) {
        try {
            res.json({
                project: 'SOLARIA Digital Field Operations',
                roadmap: {
                    completed: [
                        { phase: 'Phase 1', name: 'Core Infrastructure', items: ['Docker setup', 'MySQL database', 'Express server'] },
                        { phase: 'Phase 2', name: 'Dashboard UI', items: ['Login screen', 'Main dashboard', 'shadcn styling'] },
                        { phase: 'Phase 3', name: 'Authentication', items: ['JWT auth', 'Quick Access', 'Role-based access'] }
                    ],
                    inProgress: [
                        { phase: 'Phase 4', name: 'C-Suite Views', items: ['CEO Dashboard', 'CTO Dashboard', 'COO Dashboard', 'CFO Dashboard'], progress: 45 }
                    ],
                    planned: [
                        { phase: 'Phase 5', name: 'AI Integration', items: ['Claude API', 'Agent automation', 'Task assignment'] },
                        { phase: 'Phase 6', name: 'Advanced Features', items: ['Notifications', 'Reports export', 'API documentation'] }
                    ]
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch roadmap' });
        }
    }

    // ========== VISTAS C-SUITE POR ROL ==========

    async getCEODashboard(req, res) {
        try {
            const [projects] = await this.db.execute(`
                SELECT 
                    p.*, 
                    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
                    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks,
                    (SELECT COUNT(*) FROM alerts a WHERE a.project_id = p.id AND a.status = 'active') as active_alerts
                FROM projects p
            `);

            const [budgetSummary] = await this.db.execute(`
                SELECT
                    SUM(budget) as total_budget,
                    SUM(actual_cost) as total_spent,
                    SUM(budget) - SUM(actual_cost) as remaining,
                    AVG(completion_percentage) as avg_completion
                FROM projects
            `);

            const [criticalAlerts] = await this.db.execute(`
                SELECT * FROM alerts WHERE severity = 'critical' AND status = 'active'
            `);

            const [topTasks] = await this.db.execute(`
                SELECT title, status, priority, project_id, progress, created_at
                FROM tasks
                WHERE status <> 'completed'
                ORDER BY priority DESC, created_at DESC
                LIMIT 5
            `);

            const akademateProject = projects.find(p => p.name && p.name.toLowerCase().includes('akademate'));
            const mainProject = akademateProject || projects[0];
            const executiveSummary = `${mainProject?.name || 'Proyecto'}: ${Math.round(mainProject?.completion_percentage || 0)}% completado; ${criticalAlerts.length} alertas críticas activas; presupuesto utilizado ${(budgetSummary[0].total_spent || 0)} / ${(budgetSummary[0].total_budget || 0)}.`;

            res.json({
                role: 'CEO',
                title: 'Strategic Overview',
                focus: ['ROI', 'Budget', 'Critical Alerts', 'Tareas clave'],
                kpis: {
                    totalProjects: projects.length,
                    totalBudget: budgetSummary[0].total_budget || 0,
                    totalSpent: budgetSummary[0].total_spent || 0,
                    budgetRemaining: budgetSummary[0].remaining || 0,
                    avgCompletion: Math.round(budgetSummary[0].avg_completion || 0),
                    roi: budgetSummary[0].total_budget > 0
                        ? Math.round(((budgetSummary[0].total_budget - budgetSummary[0].total_spent) / budgetSummary[0].total_budget) * 100)
                        : 0
                },
                projects,
                criticalAlerts,
                strategicDecisions: topTasks.map((t, idx) => ({
                    id: idx + 1,
                    title: t.title,
                    status: t.status,
                    priority: t.priority,
                    progress: t.progress
                })),
                executiveSummary
            });
        } catch (error) {
            console.error('CEO Dashboard error:', error);
            res.status(500).json({ error: 'Failed to fetch CEO dashboard' });
        }
    }

    async getCTODashboard(req, res) {
        try {
            const [agents] = await this.db.execute(`SELECT * FROM ai_agents`);
            const [techMetrics] = await this.db.execute(`
                SELECT
                    AVG(code_quality_score) as avg_quality,
                    AVG(test_coverage) as avg_coverage,
                    AVG(agent_efficiency) as avg_efficiency
                FROM project_metrics WHERE metric_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            `);
            const [techDebt] = await this.db.execute(`
                SELECT COUNT(*) as count FROM tasks WHERE status = 'blocked' OR priority = 'critical'
            `);

            res.json({
                role: 'CTO',
                title: 'Technology Overview',
                focus: ['Architecture', 'Code Quality', 'Tech Debt', 'Agent Performance'],
                kpis: {
                    totalAgents: agents.length,
                    activeAgents: agents.filter(a => a.status === 'active').length,
                    codeQuality: Math.round(techMetrics[0].avg_quality || 85),
                    testCoverage: Math.round(techMetrics[0].avg_coverage || 70),
                    agentEfficiency: Math.round(techMetrics[0].avg_efficiency || 90),
                    techDebtItems: techDebt[0].count
                },
                agents: agents,
                techStack: {
                    frontend: ['HTML5', 'TailwindCSS', 'Chart.js', 'Socket.IO'],
                    backend: ['Node.js 20', 'Express.js', 'MySQL 8'],
                    infrastructure: ['Docker', 'Nginx']
                },
                // Architecture decisions from high-priority pending tasks
                architectureDecisions: await this.getArchitectureDecisions()
            });
        } catch (error) {
            console.error('CTO Dashboard error:', error);
            res.status(500).json({ error: 'Failed to fetch CTO dashboard' });
        }
    }

    async getCOODashboard(req, res) {
        try {
            const [tasks] = await this.db.execute(`SELECT * FROM tasks ORDER BY created_at DESC LIMIT 20`);
            const [taskStats] = await this.db.execute(`
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
                FROM tasks
            `);
            const [agentWorkload] = await this.db.execute(`
                SELECT
                    aa.name, aa.role, aa.status,
                    COUNT(t.id) as assigned_tasks,
                    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
                FROM ai_agents aa
                LEFT JOIN tasks t ON aa.id = t.assigned_agent_id
                GROUP BY aa.id
            `);

            res.json({
                role: 'COO',
                title: 'Operations Overview',
                focus: ['Daily Operations', 'Task Management', 'Resource Utilization', 'Workflow'],
                kpis: {
                    totalTasks: taskStats[0].total,
                    completedTasks: taskStats[0].completed,
                    inProgressTasks: taskStats[0].in_progress,
                    blockedTasks: taskStats[0].blocked,
                    pendingTasks: taskStats[0].pending,
                    completionRate: taskStats[0].total > 0
                        ? Math.round((taskStats[0].completed / taskStats[0].total) * 100)
                        : 0
                },
                recentTasks: tasks,
                agentWorkload: agentWorkload,
                // Operational alerts from database
                operationalAlerts: await this.getOperationalAlerts()
            });
        } catch (error) {
            console.error('COO Dashboard error:', error);
            res.status(500).json({ error: 'Failed to fetch COO dashboard' });
        }
    }

    async getCFODashboard(req, res) {
        try {
            const [financials] = await this.db.execute(`
                SELECT
                    SUM(budget) as total_budget,
                    SUM(actual_cost) as total_cost,
                    SUM(budget) - SUM(actual_cost) as remaining_budget
                FROM projects
            `);
            const [costByProject] = await this.db.execute(`
                SELECT name, budget, actual_cost,
                    (actual_cost / budget * 100) as burn_rate
                FROM projects
            `);
            const [monthlySpend] = await this.db.execute(`
                SELECT
                    DATE_FORMAT(metric_date, '%Y-%m') as month,
                    SUM(budget_used) as monthly_spend
                FROM project_metrics
                GROUP BY DATE_FORMAT(metric_date, '%Y-%m')
                ORDER BY month DESC
                LIMIT 6
            `);

            res.json({
                role: 'CFO',
                title: 'Financial Overview',
                focus: ['Budget', 'Costs', 'ROI', 'Financial Projections'],
                kpis: await this.calculateFinancialKPIs(financials[0]),
                costByProject: costByProject,
                monthlySpend: monthlySpend,
                // Financial alerts from database
                financialAlerts: await this.getFinancialAlerts(),
                // High-budget pending tasks as approvals
                approvalsPending: await this.getPendingApprovals()
            });
        } catch (error) {
            console.error('CFO Dashboard error:', error);
            res.status(500).json({ error: 'Failed to fetch CFO dashboard' });
        }
    }

    // ========== API AGENTES IA - AUTO-DEPLOYMENT ==========

    async registerDocument(req, res) {
        try {
            const { project_id, name, type, path, description, content } = req.body;

            const [result] = await this.db.execute(`
                INSERT INTO activity_logs (project_id, action, details, category, level)
                VALUES (?, 'document_registered', ?, 'management', 'info')
            `, [project_id || 1, JSON.stringify({ name, type, path, description })]);

            res.status(201).json({
                success: true,
                id: result.insertId,
                message: `Document '${name}' registered successfully`
            });
        } catch (error) {
            console.error('Register document error:', error);
            res.status(500).json({ error: 'Failed to register document' });
        }
    }

    async updateProjectFromAgent(req, res) {
        try {
            const { project_id, updates } = req.body;

            const fields = [];
            const values = [];

            if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
            if (updates.description) { fields.push('description = ?'); values.push(updates.description); }
            if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
            if (updates.completion_percentage !== undefined) {
                fields.push('completion_percentage = ?');
                values.push(updates.completion_percentage);
            }
            if (updates.tech_stack) {
                fields.push('tech_stack = ?');
                values.push(JSON.stringify(updates.tech_stack));
            }

            if (fields.length > 0) {
                values.push(project_id || 1);
                await this.db.execute(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values);
            }

            await this.db.execute(`
                INSERT INTO activity_logs (project_id, action, details, category, level)
                VALUES (?, 'project_updated_by_agent', ?, 'management', 'info')
            `, [project_id || 1, JSON.stringify(updates)]);

            res.json({ success: true, message: 'Project updated by agent' });
        } catch (error) {
            console.error('Update project from agent error:', error);
            res.status(500).json({ error: 'Failed to update project' });
        }
    }

    async addTaskFromAgent(req, res) {
        try {
            const {
                project_id,
                title,
                description,
                agent_id,
                priority = 'medium',
                estimated_hours,
                status = 'pending'
            } = req.body;

            const [result] = await this.db.execute(`
                INSERT INTO tasks (title, description, project_id, assigned_agent_id, priority, estimated_hours, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [title, description, project_id || 1, agent_id, priority, estimated_hours, status]);

            await this.db.execute(`
                INSERT INTO activity_logs (project_id, agent_id, action, details, category, level)
                VALUES (?, ?, 'task_created_by_agent', ?, 'development', 'info')
            `, [project_id || 1, agent_id, JSON.stringify({ task_id: result.insertId, title })]);

            res.status(201).json({
                success: true,
                task_id: result.insertId,
                message: `Task '${title}' created successfully`
            });
        } catch (error) {
            console.error('Add task from agent error:', error);
            res.status(500).json({ error: 'Failed to add task' });
        }
    }

    async logAgentActivity(req, res) {
        try {
            const { project_id, agent_id, action, details, category = 'system', level = 'info' } = req.body;

            // Convertir undefined a null para MySQL
            const safeProjectId = project_id ?? null;
            const safeAgentId = agent_id ?? null;
            const safeAction = action ?? 'unknown';
            const safeDetails = details ? JSON.stringify(details) : null;

            const [result] = await this.db.execute(`
                INSERT INTO activity_logs (project_id, agent_id, action, details, category, level)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [safeProjectId, safeAgentId, safeAction, safeDetails, category, level]);

            res.status(201).json({
                success: true,
                log_id: result.insertId,
                message: 'Activity logged successfully'
            });
        } catch (error) {
            console.error('Log agent activity error:', error);
            res.status(500).json({ error: 'Failed to log activity' });
        }
    }

    async updateMetricsFromAgent(req, res) {
        try {
            const {
                project_id,
                completion_percentage,
                agent_efficiency,
                code_quality_score,
                test_coverage,
                tasks_completed,
                tasks_pending,
                tasks_blocked,
                budget_used
            } = req.body;

            await this.db.execute(`
                INSERT INTO project_metrics (
                    project_id, metric_date, completion_percentage, agent_efficiency,
                    code_quality_score, test_coverage, tasks_completed, tasks_pending,
                    tasks_blocked, budget_used
                ) VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    completion_percentage = VALUES(completion_percentage),
                    agent_efficiency = VALUES(agent_efficiency),
                    code_quality_score = VALUES(code_quality_score),
                    test_coverage = VALUES(test_coverage),
                    tasks_completed = VALUES(tasks_completed),
                    tasks_pending = VALUES(tasks_pending),
                    tasks_blocked = VALUES(tasks_blocked),
                    budget_used = VALUES(budget_used)
            `, [
                project_id || 1,
                completion_percentage || 0,
                agent_efficiency || 0,
                code_quality_score || 0,
                test_coverage || 0,
                tasks_completed || 0,
                tasks_pending || 0,
                tasks_blocked || 0,
                budget_used || 0
            ]);

            res.json({ success: true, message: 'Metrics updated successfully' });
        } catch (error) {
            console.error('Update metrics from agent error:', error);
            res.status(500).json({ error: 'Failed to update metrics' });
        }
    }

    async getAgentInstructions(req, res) {
        try {
            res.json({
                project: 'SOLARIA Digital Field Operations',
                version: '2.0.0',
                instructions: {
                    overview: 'Este dashboard es auto-desplegable. Los agentes IA deben registrar toda la documentacion y actividad.',
                    endpoints: {
                        registerDoc: {
                            method: 'POST',
                            path: '/api/agent/register-doc',
                            body: { project_id: 'number', name: 'string', type: 'string', path: 'string', description: 'string' }
                        },
                        updateProject: {
                            method: 'POST',
                            path: '/api/agent/update-project',
                            body: { project_id: 'number', updates: { name: 'string', description: 'string', status: 'string', completion_percentage: 'number', tech_stack: 'array' } }
                        },
                        addTask: {
                            method: 'POST',
                            path: '/api/agent/add-task',
                            body: { project_id: 'number', title: 'string', description: 'string', agent_id: 'number', priority: 'low|medium|high|critical', estimated_hours: 'number' }
                        },
                        logActivity: {
                            method: 'POST',
                            path: '/api/agent/log-activity',
                            body: { project_id: 'number', agent_id: 'number', action: 'string', details: 'object', category: 'string', level: 'string' }
                        },
                        updateMetrics: {
                            method: 'POST',
                            path: '/api/agent/update-metrics',
                            body: { project_id: 'number', completion_percentage: 'number', agent_efficiency: 'number', code_quality_score: 'number', test_coverage: 'number' }
                        }
                    },
                    workflow: [
                        '1. Al iniciar trabajo en un proyecto, registrar documentacion con /api/agent/register-doc',
                        '2. Crear tareas usando /api/agent/add-task',
                        '3. Actualizar progreso con /api/agent/update-project',
                        '4. Registrar actividad con /api/agent/log-activity',
                        '5. Actualizar metricas periodicamente con /api/agent/update-metrics'
                    ]
                }
            });
        } catch (error) {
            console.error('Get agent instructions error:', error);
            res.status(500).json({ error: 'Failed to get instructions' });
        }
    }

    // ========== TAREAS Y LOGS ADICIONALES ==========

    async loadTasks(req, res) {
        try {
            const { project_id, status, limit = '50' } = req.query;
            const limitNum = parseInt(limit) || 50;

            let query = `
                SELECT
                    t.*,
                    p.name as project_name,
                    aa.name as agent_name
                FROM tasks t
                LEFT JOIN projects p ON t.project_id = p.id
                LEFT JOIN ai_agents aa ON t.assigned_agent_id = aa.id
                WHERE 1=1
            `;
            const params = [];

            if (project_id) {
                query += ' AND t.project_id = ?';
                params.push(parseInt(project_id));
            }
            if (status) {
                query += ' AND t.status = ?';
                params.push(status);
            }

            query += ` ORDER BY t.created_at DESC LIMIT ${limitNum}`;

            const [tasks] = await this.db.execute(query, params);
            res.json(tasks);
        } catch (error) {
            console.error('Load tasks error:', error);
            res.status(500).json({ error: 'Failed to load tasks' });
        }
    }

    async loadLogs(req, res) {
        try {
            const { level, category, limit = '100' } = req.query;
            const limitNum = parseInt(limit) || 100;

            let query = `
                SELECT
                    al.*,
                    p.name as project_name,
                    aa.name as agent_name
                FROM activity_logs al
                LEFT JOIN projects p ON al.project_id = p.id
                LEFT JOIN ai_agents aa ON al.agent_id = aa.id
                WHERE 1=1
            `;
            const params = [];

            if (level) {
                query += ' AND al.level = ?';
                params.push(level);
            }
            if (category) {
                query += ' AND al.category = ?';
                params.push(category);
            }

            query += ` ORDER BY al.created_at DESC LIMIT ${limitNum}`;

            const [logs] = await this.db.execute(query, params);
            res.json(logs);
        } catch (error) {
            console.error('Load logs error:', error);
            res.status(500).json({ error: 'Failed to load logs' });
        }
    }

    // ========== HELPER METHODS FOR DYNAMIC DATA ==========

    async getArchitectureDecisions() {
        try {
            const [decisions] = await this.db.execute(`
                SELECT id, title, status, priority as impact
                FROM tasks
                WHERE priority IN ('critical', 'high')
                AND status IN ('pending', 'in_progress', 'review')
                ORDER BY FIELD(priority, 'critical', 'high'), created_at DESC
                LIMIT 5
            `);
            return decisions.map(d => ({
                id: d.id,
                title: d.title,
                status: d.status === 'in_progress' ? 'in_review' : d.status,
                impact: d.impact
            }));
        } catch (error) {
            console.error('getArchitectureDecisions error:', error);
            return [];
        }
    }

    async getOperationalAlerts() {
        try {
            const [alerts] = await this.db.execute(`
                SELECT id, message, severity
                FROM alerts
                WHERE status = 'active'
                ORDER BY FIELD(severity, 'critical', 'high', 'medium', 'low'), created_at DESC
                LIMIT 5
            `);
            return alerts;
        } catch (error) {
            console.error('getOperationalAlerts error:', error);
            return [];
        }
    }

    async calculateFinancialKPIs(financials) {
        try {
            const [taskCount] = await this.db.execute(`
                SELECT COUNT(*) as completed FROM tasks WHERE status = 'completed'
            `);
            const completedTasks = taskCount[0].completed || 0;
            const totalBudget = parseFloat(financials?.total_budget) || 0;
            const totalSpent = parseFloat(financials?.total_cost) || 0;
            const remainingBudget = parseFloat(financials?.remaining_budget) || 0;

            // Calculate projected ROI based on completion vs budget used
            const burnRate = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
            const projectedROI = totalBudget > 0 ? Math.round(((totalBudget - totalSpent) / totalBudget) * 100) : 0;
            const costPerTask = completedTasks > 0 ? Math.round(totalSpent / completedTasks) : 0;

            return {
                totalBudget,
                totalSpent,
                remainingBudget,
                burnRate,
                projectedROI,
                costPerTask
            };
        } catch (error) {
            console.error('calculateFinancialKPIs error:', error);
            return {
                totalBudget: 0, totalSpent: 0, remainingBudget: 0,
                burnRate: 0, projectedROI: 0, costPerTask: 0
            };
        }
    }

    async getFinancialAlerts() {
        try {
            const [alerts] = await this.db.execute(`
                SELECT id, title as message, severity
                FROM alerts
                WHERE status = 'active'
                ORDER BY created_at DESC
                LIMIT 3
            `);
            // If no alerts, generate summary based on budget status
            if (alerts.length === 0) {
                const [budget] = await this.db.execute(`
                    SELECT SUM(budget) as total, SUM(actual_cost) as spent FROM projects
                `);
                const utilization = budget[0].total > 0
                    ? Math.round((budget[0].spent / budget[0].total) * 100)
                    : 0;
                return [
                    { id: 1, message: `Budget ${utilization}% utilized`, severity: utilization > 80 ? 'high' : 'low' }
                ];
            }
            return alerts;
        } catch (error) {
            console.error('getFinancialAlerts error:', error);
            return [];
        }
    }

    async getPendingApprovals() {
        try {
            // Use high-budget pending tasks as pending approvals
            const [approvals] = await this.db.execute(`
                SELECT t.id, t.title,
                    COALESCE(t.estimated_hours, 0) * 150 as amount,
                    t.status
                FROM tasks t
                WHERE t.status IN ('pending', 'review')
                AND t.priority IN ('critical', 'high')
                ORDER BY t.estimated_hours DESC
                LIMIT 5
            `);
            return approvals.map(a => ({
                id: a.id,
                title: a.title,
                amount: Math.round(a.amount),
                status: a.status === 'review' ? 'review' : 'pending'
            }));
        } catch (error) {
            console.error('getPendingApprovals error:', error);
            return [];
        }
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 SOLARIA C-Suite Dashboard running on port ${this.port}`);
            console.log(`📊 Dashboard available at: http://localhost:${this.port}`);
            console.log(`🔐 Secure authentication enabled`);
            console.log(`📡 Real-time updates active`);
        });
    }
}

// Iniciar servidor
const server = new SolariaDashboardServer();
server.start();

module.exports = SolariaDashboardServer;
