/**
 * SOLARIA C-Suite Dashboard - Frontend v4.0
 * Dashboard interactivo para proyecto Akademate.com
 * Agentes SOLARIA - Sistema de Construccion en Campo
 */

class SolariaDashboard {
    constructor() {
        this.apiBase = '/api';
        this.token = localStorage.getItem('solaria_token');
        this.user = null;
        this.socket = null;
        this.charts = {};
        this.refreshInterval = null;

        // Data caches
        this.projectData = null;
        this.tasksData = [];
        this.agentsData = [];
        this.logsData = [];
        this.docsData = [];

        // Current agent for detail view
        this.currentAgentId = null;

        // Task sorting preference
        this.taskSortBy = 'priority'; // 'priority', 'status', 'progress'

        this.init();
    }

    async init() {
        if (this.token) {
            await this.verifyToken();
        } else {
            this.showLogin();
        }
    }

    // Authentication
    async verifyToken() {
        try {
            const response = await fetch(`${this.apiBase}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.showDashboard();
                this.initializeSocket();
                this.startRealTimeUpdates();
            } else {
                this.showLogin();
            }
        } catch (error) {
            this.showLogin();
        }
    }

    async login(userId, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('solaria_token', this.token);
                this.showDashboard();
                this.initializeSocket();
                this.startRealTimeUpdates();
                return true;
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            this.showError('loginError', error.message);
            return false;
        }
    }

    logout() {
        localStorage.removeItem('solaria_token');
        this.token = null;
        this.user = null;
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        if (this.socket) this.socket.disconnect();
        window.location.reload();
    }

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('dashboardScreen').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboardScreen').classList.remove('hidden');
        this.updateUserInfo();
        this.setupNavigation();
        this.loadAllData();
    }

    updateUserInfo() {
        if (!this.user) return;
        const nameEl = document.getElementById('userName');
        const initialEl = document.getElementById('userInitial');
        const roleEl = document.getElementById('userRole');

        if (nameEl) nameEl.textContent = this.user.name || this.user.username;
        if (initialEl) initialEl.textContent = (this.user.name || this.user.username).charAt(0).toUpperCase();
        if (roleEl) {
            roleEl.textContent = this.user.role.toUpperCase();
            roleEl.className = `role-badge role-${this.user.role}`;
        }
    }

    setupNavigation() {
        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.showSection(section);
            });
        });
    }

    showSection(section) {
        document.querySelectorAll('section[id$="Section"]').forEach(s => s.classList.add('hidden'));

        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        document.querySelectorAll('[data-section]').forEach(btn => {
            btn.classList.remove('active', 'text-foreground');
            btn.classList.add('text-muted-foreground');
        });
        const activeBtn = document.querySelector(`[data-section="${section}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'text-foreground');
            activeBtn.classList.remove('text-muted-foreground');
        }

        const titles = {
            overview: ['Overview', 'Vista ejecutiva del proyecto Akademate.com'],
            projects: ['Proyecto Akademate.com', 'Gestion completa del proyecto'],
            agents: ['Agentes SOLARIA', 'Equipo de agentes IA especializados'],
            agentDetail: ['Detalle de Agente', 'Informacion completa del agente'],
            tasks: ['Tareas', 'Gestion y seguimiento de tareas'],
            alerts: ['Alertas', 'Centro de alertas del sistema'],
            docs: ['Documentacion', 'Documentos del repositorio'],
            analytics: ['Analytics', 'Metricas y reportes'],
            logs: ['Activity Logs', 'Registro de actividad del sistema'],
            settings: ['Configuracion', 'Preferencias del sistema'],
            ceo: ['CEO Dashboard', 'Vision estrategica global'],
            cto: ['CTO Dashboard', 'Tecnologia y arquitectura'],
            coo: ['COO Dashboard', 'Operaciones y flujo de trabajo'],
            cfo: ['CFO Dashboard', 'Finanzas y presupuesto']
        };

        const [title, subtitle] = titles[section] || ['Dashboard', 'SOLARIA Field Operations'];
        document.getElementById('pageTitle').textContent = title;
        document.getElementById('pageSubtitle').textContent = subtitle;

        this.loadSectionData(section);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'overview': await this.loadOverview(); break;
            case 'projects': await this.loadProjectDetail(); break;
            case 'agents': await this.loadAgents(); break;
            case 'agentDetail': await this.loadAgentDetailPage(); break;
            case 'tasks': await this.loadTasks(); break;
            case 'alerts': await this.loadAlerts(); break;
            case 'docs': await this.loadProjectDocs(); break;
            case 'analytics': await this.loadAnalyticsData(); break;
            case 'logs': await this.loadActivityLogs(); break;
            case 'ceo': await this.loadCEODashboard(); break;
            case 'cto': await this.loadCTODashboard(); break;
            case 'coo': await this.loadCOODashboard(); break;
            case 'cfo': await this.loadCFODashboard(); break;
        }
    }

    async loadAllData() {
        this.showLoading(true);
        try {
            await Promise.all([
                this.fetchProject(),
                this.fetchTasks(),
                this.fetchAgents()
            ]);
            await this.loadOverview();
        } finally {
            this.showLoading(false);
        }
    }

    async fetchProject() {
        try {
            const response = await fetch(`${this.apiBase}/projects`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                const projects = await response.json();
                this.projectData = projects.find(p => p.name.toLowerCase().includes('akademate')) || projects[0];
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        }
    }

    async fetchTasks() {
        try {
            const response = await fetch(`${this.apiBase}/tasks`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                const tasks = await response.json();
                this.tasksData = tasks.filter(t => t.project_id === 2 || t.project_name?.toLowerCase().includes('akademate'));
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    async fetchAgents() {
        try {
            const response = await fetch(`${this.apiBase}/agents`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                this.agentsData = await response.json();
                this.agentsData = this.agentsData.map(a => ({
                    ...a,
                    name: a.name.replace('NEMESIS-', 'SOLARIA-'),
                    displayName: this.getAgentDisplayName(a.role)
                }));
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
        }
    }

    getAgentDisplayName(role) {
        const names = {
            project_manager: 'Project Manager',
            architect: 'Solutions Architect',
            developer: 'Software Developer',
            tester: 'QA Engineer',
            analyst: 'Business Analyst',
            designer: 'UX Designer',
            devops: 'DevOps Engineer',
            technical_writer: 'Technical Writer',
            security_auditor: 'Security Auditor'
        };
        return names[role] || role;
    }

    getAgentDescription(role) {
        const descriptions = {
            project_manager: 'Responsable de la coordinacion general del proyecto, planificacion de sprints, seguimiento de progreso y gestion de riesgos.',
            architect: 'Diseña la arquitectura del sistema, define patrones de diseño, toma decisiones tecnicas criticas y asegura la escalabilidad.',
            developer: 'Implementa funcionalidades siguiendo las mejores practicas de desarrollo. Escribe codigo limpio, mantenible y bien documentado.',
            tester: 'Diseña estrategias de testing, escribe tests automatizados y asegura la calidad del producto antes de cada release.',
            analyst: 'Analiza requisitos de negocio, define historias de usuario, prioriza el backlog y asegura que el producto cumpla con las necesidades.',
            designer: 'Crea diseños de interfaz, define sistemas de diseño y asegura una experiencia de usuario optima.',
            devops: 'Configura infraestructura, implementa CI/CD, gestiona deployments y monitorea sistemas en produccion.',
            technical_writer: 'Crea documentacion tecnica, guias de usuario y documentacion de API.',
            security_auditor: 'Realiza auditorias de seguridad, identifica vulnerabilidades y asegura cumplimiento de estandares.'
        };
        return descriptions[role] || 'Agente IA especializado.';
    }

    getAgentCapabilities(role) {
        const capabilities = {
            project_manager: ['Planificacion', 'Coordinacion', 'Reporting', 'Risk Management', 'Scrum/Agile'],
            architect: ['System Design', 'Code Review', 'Technical Decisions', 'Documentation', 'Scalability'],
            developer: ['Frontend', 'Backend', 'APIs', 'Testing', 'Git'],
            tester: ['Unit Tests', 'E2E Tests', 'QA Manual', 'Performance', 'Security'],
            analyst: ['Requirements', 'User Stories', 'Backlog', 'Metrics', 'UX Research'],
            designer: ['UI Design', 'UX', 'Prototyping', 'Design Systems', 'Accessibility'],
            devops: ['CI/CD', 'Docker', 'Kubernetes', 'Monitoring', 'Infrastructure'],
            technical_writer: ['API Docs', 'User Guides', 'Tutorials', 'Release Notes'],
            security_auditor: ['OWASP', 'Penetration Testing', 'Compliance', 'Code Audit']
        };
        return capabilities[role] || ['General AI'];
    }

    // Overview Section - Cards Interactivas
    async loadOverview() {
        const totalTasks = this.tasksData.length;
        const completedTasks = this.tasksData.filter(t => t.status === 'completed').length;
        const activeAgents = this.agentsData.filter(a => a.status === 'active').length;

        document.getElementById('totalProjects').textContent = '1';
        document.getElementById('activeAgents').textContent = activeAgents;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('criticalAlerts').textContent = '0';

        this.setupOverviewCards();
        this.renderProgressChart();
        this.renderAgentChart();
        this.renderRecentActivity();
    }

    setupOverviewCards() {
        const cards = ['projects', 'agents', 'tasks', 'alerts'];
        cards.forEach(card => {
            const el = document.querySelector(`[data-card="${card}"]`);
            if (el) {
                el.classList.add('cursor-pointer', 'hover:border-solaria/50', 'transition-colors');
                el.onclick = () => this.showSection(card === 'tasks' ? 'projects' : card);
            }
        });
    }

    renderProgressChart() {
        const ctx = document.getElementById('projectProgressChart');
        if (!ctx) return;
        if (this.charts.progress) this.charts.progress.destroy();

        const completed = this.tasksData.filter(t => t.status === 'completed').length;
        const inProgress = this.tasksData.filter(t => t.status === 'in_progress').length;
        const pending = this.tasksData.filter(t => t.status === 'pending').length;
        const blocked = this.tasksData.filter(t => t.status === 'blocked').length;

        const isDark = document.documentElement.classList.contains('dark');
        const labelColor = isDark ? '#a1a1aa' : '#6b7280';

        this.charts.progress = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completadas', 'En Progreso', 'Pendientes', 'Bloqueadas'],
                datasets: [{
                    data: [completed, inProgress, pending, blocked],
                    backgroundColor: ['#22c55e', '#3b82f6', '#9ca3af', '#ef4444'],
                    borderWidth: 0,
                    borderColor: isDark ? '#18181b' : '#ffffff',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: labelColor,
                            padding: 12,
                            font: { size: 12 }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    renderAgentChart() {
        const ctx = document.getElementById('agentPerformanceChart');
        if (!ctx) return;
        if (this.charts.agent) this.charts.agent.destroy();

        const agentNames = this.agentsData.slice(0, 6).map(a => a.name.replace('SOLARIA-', ''));
        const taskCounts = this.agentsData.slice(0, 6).map(a => this.tasksData.filter(t => t.assigned_agent_id === a.id).length);

        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? '#27272a' : '#e5e7eb';
        const textColor = isDark ? '#a1a1aa' : '#6b7280';

        this.charts.agent = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: agentNames,
                datasets: [{
                    label: 'Tareas',
                    data: taskCounts,
                    backgroundColor: '#f6921d',
                    borderRadius: 6,
                    hoverBackgroundColor: '#f9a94d'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        titleColor: isDark ? '#fafafa' : '#09090b',
                        bodyColor: isDark ? '#a1a1aa' : '#6b7280',
                        borderColor: isDark ? '#27272a' : '#e5e7eb',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const recentTasks = this.tasksData.slice(0, 5);
        if (recentTasks.length === 0) {
            container.innerHTML = '<p class="text-muted-foreground text-sm">No hay actividad reciente</p>';
            return;
        }

        container.innerHTML = recentTasks.map(task => {
            const agent = this.agentsData.find(a => a.id === task.assigned_agent_id);
            const statusColors = { completed: 'text-green-500', in_progress: 'text-blue-500', pending: 'text-muted-foreground', blocked: 'text-red-500' };
            return `
                <div class="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer" onclick="dashboard.showTaskDetail(${task.id})">
                    <div class="w-10 h-10 rounded-lg bg-solaria/10 flex items-center justify-center shrink-0"><i class="fa-solid fa-tasks text-solaria text-sm"></i></div>
                    <div class="flex-1 min-w-0"><p class="text-sm font-medium text-foreground truncate">${this.escapeHtml(task.title)}</p><p class="text-xs text-muted-foreground">${agent ? agent.name : 'Sin asignar'}</p></div>
                    <span class="text-xs ${statusColors[task.status] || ''} shrink-0">${task.status}</span>
                </div>
            `;
        }).join('');
    }

    // Project Detail Section
    async loadProjectDetail() {
        const container = document.getElementById('projectsGrid');
        if (!container) return;
        if (!this.projectData) await this.fetchProject();

        const project = this.projectData;
        const projectTasks = this.tasksData;
        const completed = projectTasks.filter(t => t.status === 'completed').length;
        const total = projectTasks.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        let docsCount = 0;
        try {
            const docsResponse = await fetch(`${this.apiBase}/docs/list`, { headers: { 'Authorization': `Bearer ${this.token}` } });
            if (docsResponse.ok) { const docsData = await docsResponse.json(); docsCount = docsData.total || 0; }
        } catch (e) {}

        container.innerHTML = `
            <div class="col-span-3 space-y-6">
                <div class="bg-card rounded-xl p-6 border border-border">
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex items-center gap-4">
                            <div class="w-20 h-20 rounded-xl bg-gradient-to-br from-solaria to-solaria-dark flex items-center justify-center">
                                <i class="fa-solid fa-graduation-cap text-white text-3xl"></i>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-foreground">${project?.name || 'Akademate.com'}</h2>
                                <p class="text-muted-foreground max-w-2xl">${project?.description || 'Plataforma SaaS Multi-tenant para Academias'}</p>
                                <div class="flex items-center gap-3 mt-3">
                                    <span class="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">SaaS</span>
                                    <span class="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Multi-tenant</span>
                                    <span class="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">Enterprise</span>
                                </div>
                            </div>
                        </div>
                        <button onclick="dashboard.showProjectEditModal()" class="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-sm">
                            <i class="fa-solid fa-edit mr-2"></i>Editar
                        </button>
                    </div>
                    <div class="mb-6">
                        <div class="flex justify-between text-sm mb-2">
                            <span class="text-muted-foreground">Progreso del Proyecto</span>
                            <span class="text-foreground font-medium">${progress}% (${completed}/${total} tareas)</span>
                        </div>
                        <div class="w-full h-4 bg-secondary rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-solaria to-solaria-light rounded-full" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-5 gap-4">
                        <div class="p-4 rounded-lg bg-secondary/50 text-center"><p class="text-2xl font-bold text-foreground">${total}</p><p class="text-xs text-muted-foreground">Total</p></div>
                        <div class="p-4 rounded-lg bg-secondary/50 text-center"><p class="text-2xl font-bold text-green-500">${completed}</p><p class="text-xs text-muted-foreground">Completadas</p></div>
                        <div class="p-4 rounded-lg bg-secondary/50 text-center"><p class="text-2xl font-bold text-blue-500">${projectTasks.filter(t => t.status === 'in_progress').length}</p><p class="text-xs text-muted-foreground">En Progreso</p></div>
                        <div class="p-4 rounded-lg bg-secondary/50 text-center"><p class="text-2xl font-bold text-solaria">$${((project?.budget || 150000) / 1000).toFixed(0)}K</p><p class="text-xs text-muted-foreground">Presupuesto</p></div>
                        <div class="p-4 rounded-lg bg-secondary/50 text-center cursor-pointer hover:bg-secondary/70" onclick="dashboard.showSection('docs')"><p class="text-2xl font-bold text-purple-500">${docsCount}</p><p class="text-xs text-muted-foreground">Documentos</p></div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-6">
                    <div class="bg-card rounded-xl p-6 border border-border">
                        <h3 class="text-lg font-semibold text-foreground mb-4"><i class="fa-solid fa-info-circle text-solaria mr-2"></i>Descripcion</h3>
                        <p class="text-muted-foreground text-sm leading-relaxed">Akademate.com es una plataforma SaaS multi-tenant para academias de formacion profesional. Gestiona cursos, estudiantes, instructores, pagos y certificaciones.</p>
                        <div class="mt-4 space-y-2 text-sm">
                            <div class="flex justify-between"><span class="text-muted-foreground">Cliente:</span><span class="text-foreground">SOLARIA Agency</span></div>
                            <div class="flex justify-between"><span class="text-muted-foreground">Inicio:</span><span class="text-foreground">${project?.start_date ? new Date(project.start_date).toLocaleDateString('es-ES') : 'Dic 2024'}</span></div>
                        </div>
                    </div>
                    <div class="bg-card rounded-xl p-6 border border-border">
                        <h3 class="text-lg font-semibold text-foreground mb-4"><i class="fa-solid fa-layer-group text-solaria mr-2"></i>Tech Stack</h3>
                        <div class="space-y-2">
                            <div class="flex items-center justify-between p-2 rounded bg-secondary/50"><span class="text-foreground text-sm">Next.js 15</span><span class="text-xs text-green-400">Frontend</span></div>
                            <div class="flex items-center justify-between p-2 rounded bg-secondary/50"><span class="text-foreground text-sm">Payload CMS 3.0</span><span class="text-xs text-blue-400">Backend</span></div>
                            <div class="flex items-center justify-between p-2 rounded bg-secondary/50"><span class="text-foreground text-sm">PostgreSQL</span><span class="text-xs text-purple-400">Database</span></div>
                            <div class="flex items-center justify-between p-2 rounded bg-secondary/50"><span class="text-foreground text-sm">Redis + BullMQ</span><span class="text-xs text-red-400">Cache/Queue</span></div>
                        </div>
                    </div>
                    <div class="bg-card rounded-xl p-6 border border-border">
                        <h3 class="text-lg font-semibold text-foreground mb-4"><i class="fa-solid fa-users text-solaria mr-2"></i>Equipo SOLARIA</h3>
                        <div class="space-y-3">
                            ${this.agentsData.filter(a => a.status === 'active').slice(0, 4).map(agent => `
                                <div class="flex items-center gap-3 cursor-pointer hover:bg-secondary/30 p-2 rounded-lg -mx-2" onclick="dashboard.goToAgentDetail(${agent.id})">
                                    <div class="w-8 h-8 rounded-lg bg-solaria/20 flex items-center justify-center"><i class="fa-solid fa-robot text-solaria text-sm"></i></div>
                                    <div class="flex-1"><p class="text-sm font-medium text-foreground">${agent.name}</p></div>
                                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                                </div>
                            `).join('')}
                        </div>
                        <button onclick="dashboard.showSection('agents')" class="mt-4 w-full py-2 text-sm text-solaria hover:underline">Ver todos →</button>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex gap-2">
                        <button onclick="dashboard.showProjectView('list')" class="px-4 py-2 rounded-lg bg-solaria text-white text-sm" id="viewListBtn"><i class="fa-solid fa-list mr-2"></i>Lista</button>
                        <button onclick="dashboard.showProjectView('kanban')" class="px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm hover:bg-secondary/80" id="viewKanbanBtn"><i class="fa-solid fa-columns mr-2"></i>Kanban</button>
                        <button onclick="dashboard.showProjectView('gantt')" class="px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm hover:bg-secondary/80" id="viewGanttBtn"><i class="fa-solid fa-chart-gantt mr-2"></i>Gantt</button>
                        <button onclick="dashboard.showSection('docs')" class="px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm hover:bg-secondary/80"><i class="fa-solid fa-file-alt mr-2"></i>Docs</button>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-muted-foreground">Ordenar por:</span>
                        <select id="taskSortSelect" class="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm" onchange="dashboard.changeTaskSort(this.value)">
                            <option value="priority" ${this.taskSortBy === 'priority' ? 'selected' : ''}>Prioridad</option>
                            <option value="status" ${this.taskSortBy === 'status' ? 'selected' : ''}>Estado</option>
                            <option value="progress" ${this.taskSortBy === 'progress' ? 'selected' : ''}>Progreso</option>
                        </select>
                    </div>
                </div>

                <div id="projectViewContainer">${this.renderTaskListView()}</div>
            </div>
        `;
    }

    changeTaskSort(sortBy) {
        this.taskSortBy = sortBy;
        const container = document.getElementById('projectViewContainer');
        if (container) container.innerHTML = this.renderTaskListView();
    }

    showProjectEditModal() {
        const project = this.projectData || {};
        const modal = document.createElement('div');
        modal.id = 'projectModal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.innerHTML = `
            <div class="bg-card rounded-2xl border border-border w-full max-w-xl">
                <div class="p-6 border-b border-border flex items-center justify-between">
                    <h2 class="text-xl font-bold text-foreground">Editar Proyecto</h2>
                    <button onclick="document.getElementById('projectModal').remove()" class="p-2 rounded-lg hover:bg-secondary"><i class="fa-solid fa-times text-muted-foreground"></i></button>
                </div>
                <div class="p-6 space-y-4">
                    <div><label class="block text-sm font-medium text-foreground mb-2">Nombre</label><input type="text" id="editProjectName" value="${this.escapeHtml(project.name || '')}" class="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground"></div>
                    <div><label class="block text-sm font-medium text-foreground mb-2">Cliente</label><input type="text" id="editProjectClient" value="${this.escapeHtml(project.client || 'SOLARIA Agency')}" class="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground"></div>
                    <div><label class="block text-sm font-medium text-foreground mb-2">Presupuesto ($)</label><input type="number" id="editProjectBudget" value="${project.budget || 150000}" class="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground"></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="block text-sm font-medium text-foreground mb-2">Fecha Inicio</label><input type="date" id="editProjectStart" value="${project.start_date?.split('T')[0] || ''}" class="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground"></div>
                        <div><label class="block text-sm font-medium text-foreground mb-2">Deadline</label><input type="date" id="editProjectDeadline" value="${project.deadline?.split('T')[0] || ''}" class="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground"></div>
                    </div>
                    <div><label class="block text-sm font-medium text-foreground mb-2">Descripcion</label><textarea id="editProjectDesc" rows="3" class="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground resize-none">${this.escapeHtml(project.description || '')}</textarea></div>
                </div>
                <div class="p-6 border-t border-border flex justify-end gap-3">
                    <button onclick="document.getElementById('projectModal').remove()" class="px-4 py-2 rounded-lg bg-secondary text-muted-foreground">Cancelar</button>
                    <button onclick="dashboard.saveProjectEdit()" class="px-4 py-2 rounded-lg bg-solaria text-white">Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async saveProjectEdit() {
        const projectId = this.projectData?.id || 2;
        const data = {
            name: document.getElementById('editProjectName').value,
            client: document.getElementById('editProjectClient').value,
            budget: parseFloat(document.getElementById('editProjectBudget').value),
            start_date: document.getElementById('editProjectStart').value || null,
            deadline: document.getElementById('editProjectDeadline').value || null,
            description: document.getElementById('editProjectDesc').value
        };

        try {
            const response = await fetch(`${this.apiBase}/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                document.getElementById('projectModal')?.remove();
                await this.fetchProject();
                await this.loadProjectDetail();
            }
        } catch (error) { console.error('Error saving project:', error); }
    }

    showProjectView(view) {
        ['list', 'kanban', 'gantt'].forEach(v => {
            const btn = document.getElementById(`view${v.charAt(0).toUpperCase() + v.slice(1)}Btn`);
            if (btn) btn.className = v === view ? 'px-4 py-2 rounded-lg bg-solaria text-white text-sm' : 'px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm hover:bg-secondary/80';
        });
        const container = document.getElementById('projectViewContainer');
        if (!container) return;
        switch (view) {
            case 'list': container.innerHTML = this.renderTaskListView(); break;
            case 'kanban': container.innerHTML = this.renderKanbanView(); break;
            case 'gantt': container.innerHTML = this.renderGanttView(); break;
        }
    }

    getSortedTasks() {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const statusOrder = { pending: 0, in_progress: 1, blocked: 2, completed: 3 };

        return [...this.tasksData].sort((a, b) => {
            if (this.taskSortBy === 'priority') {
                return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
            } else if (this.taskSortBy === 'status') {
                return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
            } else if (this.taskSortBy === 'progress') {
                return (b.progress || 0) - (a.progress || 0);
            }
            return 0;
        });
    }

    renderTaskListView() {
        const sortedTasks = this.getSortedTasks();
        if (sortedTasks.length === 0) return '<div class="bg-card rounded-xl border border-border p-8 text-center"><p class="text-muted-foreground">No hay tareas disponibles</p></div>';

        return `<div class="bg-card rounded-xl border border-border divide-y divide-border">${sortedTasks.map(task => this.renderTaskRow(task)).join('')}</div>`;
    }

    renderTaskRow(task) {
        const agent = this.agentsData.find(a => a.id === task.assigned_agent_id);
        const priorityColors = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-gray-500' };
        const statusColors = { completed: 'bg-green-500/20 text-green-400', in_progress: 'bg-blue-500/20 text-blue-400', pending: 'bg-gray-500/20 text-gray-400', blocked: 'bg-red-500/20 text-red-400' };
        const progress = task.progress || 0;
        const isCompleted = task.status === 'completed';

        return `
            <div class="p-4 hover:bg-secondary/30 transition-colors cursor-pointer ${isCompleted ? 'opacity-70' : ''}" onclick="dashboard.showTaskDetail(${task.id})">
                <div class="flex items-center gap-4">
                    <div class="w-1 h-12 ${priorityColors[task.priority] || 'bg-gray-500'} rounded-full"></div>
                    ${isCompleted ? '<i class="fa-solid fa-check-circle text-green-500 text-lg"></i>' : ''}
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <h4 class="font-medium text-foreground truncate ${isCompleted ? 'line-through' : ''}">${this.escapeHtml(task.title)}</h4>
                            <span class="px-2 py-0.5 rounded text-xs ${statusColors[task.status] || ''}">${task.status}</span>
                        </div>
                        <p class="text-sm text-muted-foreground truncate">${this.escapeHtml(task.description || 'Sin descripcion')}</p>
                    </div>
                    <div class="w-32 shrink-0">
                        <div class="flex justify-between text-xs mb-1"><span class="text-muted-foreground">Progreso</span><span class="text-foreground">${progress}%</span></div>
                        <div class="w-full h-2 bg-secondary rounded-full overflow-hidden"><div class="h-full ${isCompleted ? 'bg-green-500' : 'bg-solaria'} rounded-full" style="width: ${progress}%"></div></div>
                    </div>
                    <div class="w-32 shrink-0 text-right">
                        <p class="text-sm text-foreground">${agent ? agent.name : 'Sin asignar'}</p>
                        <p class="text-xs text-muted-foreground">${task.estimated_hours || 0}h</p>
                    </div>
                    <i class="fa-solid fa-chevron-right text-muted-foreground"></i>
                </div>
            </div>
        `;
    }

    renderKanbanView() {
        const columns = [
            { id: 'pending', title: 'Pendientes', color: 'border-gray-500' },
            { id: 'in_progress', title: 'En Progreso', color: 'border-blue-500' },
            { id: 'completed', title: 'Completadas', color: 'border-green-500' },
            { id: 'blocked', title: 'Bloqueadas', color: 'border-red-500' }
        ];

        return `
            <div class="grid grid-cols-4 gap-4">
                ${columns.map(col => {
                    const tasks = this.tasksData.filter(t => t.status === col.id);
                    return `
                        <div class="bg-card rounded-xl border ${col.color} border-t-4">
                            <div class="p-4 border-b border-border"><h3 class="font-semibold text-foreground">${col.title}</h3><p class="text-sm text-muted-foreground">${tasks.length} tareas</p></div>
                            <div class="p-2 space-y-2 max-h-96 overflow-y-auto">${tasks.map(task => this.renderKanbanCard(task)).join('')}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderKanbanCard(task) {
        const agent = this.agentsData.find(a => a.id === task.assigned_agent_id);
        const priorityColors = { critical: 'border-l-red-500', high: 'border-l-orange-500', medium: 'border-l-yellow-500', low: 'border-l-gray-500' };
        const isCompleted = task.status === 'completed';

        return `
            <div class="p-3 rounded-lg bg-secondary/50 border-l-4 ${priorityColors[task.priority] || ''} cursor-pointer hover:bg-secondary/80" onclick="dashboard.showTaskDetail(${task.id})">
                <p class="text-sm font-medium text-foreground mb-2 ${isCompleted ? 'line-through opacity-70' : ''}">${this.escapeHtml(task.title)}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs text-muted-foreground">${agent ? agent.name.replace('SOLARIA-', '') : 'N/A'}</span>
                    ${isCompleted ? '<i class="fa-solid fa-check-circle text-green-500"></i>' : `<span class="text-xs text-solaria">${task.progress || 0}%</span>`}
                </div>
            </div>
        `;
    }

    renderGanttView() {
        const sortedTasks = this.getSortedTasks();
        const maxHours = Math.max(...sortedTasks.map(t => parseFloat(t.estimated_hours) || 8), 40);
        const statusBadge = { completed: 'bg-green-500/20 text-green-400', in_progress: 'bg-blue-500/20 text-blue-400', pending: 'bg-gray-500/20 text-gray-400', blocked: 'bg-red-500/20 text-red-400' };
        const priorityColors = { critical: 'from-red-500 to-red-600', high: 'from-orange-500 to-orange-600', medium: 'from-solaria to-solaria-dark', low: 'from-gray-500 to-gray-600' };

        return `
            <div class="bg-card rounded-xl border border-border">
                <div class="p-4 border-b border-border flex items-center justify-between">
                    <h3 class="font-semibold text-foreground">Vista Gantt</h3>
                    <div class="flex items-center gap-4 text-xs">
                        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-red-500"></span>Critica</span>
                        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-orange-500"></span>Alta</span>
                        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-solaria"></span>Media</span>
                        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-gray-500"></span>Baja</span>
                    </div>
                </div>
                <div class="p-4 space-y-2">
                    <div class="flex items-center gap-4 pb-2 border-b border-border">
                        <div class="w-72 text-sm font-medium text-muted-foreground">Tarea</div>
                        <div class="w-24 text-sm font-medium text-muted-foreground text-center">Estado</div>
                        <div class="flex-1 flex items-center"><div class="w-16 text-xs text-muted-foreground">0h</div><div class="flex-1 text-xs text-muted-foreground text-center">${Math.round(maxHours/2)}h</div><div class="w-16 text-xs text-muted-foreground text-right">${maxHours}h</div></div>
                    </div>
                    ${sortedTasks.map(task => {
                        const hours = parseFloat(task.estimated_hours) || 8;
                        const width = (hours / maxHours) * 100;
                        const progress = task.progress || 0;
                        const agent = this.agentsData.find(a => a.id === task.assigned_agent_id);
                        const isCompleted = task.status === 'completed';

                        return `
                            <div class="flex items-center gap-4 py-2 hover:bg-secondary/30 cursor-pointer rounded ${isCompleted ? 'opacity-70' : ''}" onclick="dashboard.showTaskDetail(${task.id})">
                                <div class="w-72">
                                    <p class="text-sm text-foreground truncate ${isCompleted ? 'line-through' : ''}">${this.escapeHtml(task.title)}</p>
                                    <p class="text-xs text-muted-foreground">${agent ? agent.name : 'Sin asignar'}</p>
                                </div>
                                <div class="w-24 text-center"><span class="px-2 py-1 rounded text-xs ${statusBadge[task.status] || ''}">${task.status}</span></div>
                                <div class="flex-1 h-8 bg-secondary/50 rounded relative">
                                    <div class="absolute inset-y-0 left-0 bg-gradient-to-r ${isCompleted ? 'from-green-500 to-green-600' : priorityColors[task.priority] || 'from-solaria to-solaria-dark'} rounded flex items-center" style="width: ${width}%">
                                        <div class="absolute inset-y-0 left-0 bg-white/30 rounded" style="width: ${progress}%"></div>
                                        <span class="text-xs text-white px-2 truncate font-medium">${hours}h - ${progress}%</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    showTaskDetail(taskId) {
        const task = this.tasksData.find(t => t.id === taskId);
        if (!task) return;

        const agent = this.agentsData.find(a => a.id === task.assigned_agent_id);
        const priorityLabels = { critical: 'Critica', high: 'Alta', medium: 'Media', low: 'Baja' };
        const statusLabels = { completed: 'Completada', in_progress: 'En Progreso', pending: 'Pendiente', blocked: 'Bloqueada' };
        const isCompleted = task.status === 'completed';

        const modal = document.createElement('div');
        modal.id = 'taskModal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.innerHTML = `
            <div class="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-border">
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="flex items-center gap-3 mb-2">
                                ${isCompleted ? '<i class="fa-solid fa-check-circle text-green-500 text-2xl"></i>' : ''}
                                <h2 class="text-xl font-bold text-foreground">${this.escapeHtml(task.title)}</h2>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-1 rounded text-xs bg-${task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'orange' : 'yellow'}-500/20 text-${task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'orange' : 'yellow'}-400">${priorityLabels[task.priority] || task.priority}</span>
                                <span class="px-2 py-1 rounded text-xs bg-${isCompleted ? 'green' : task.status === 'in_progress' ? 'blue' : 'gray'}-500/20 text-${isCompleted ? 'green' : task.status === 'in_progress' ? 'blue' : 'gray'}-400">${statusLabels[task.status] || task.status}</span>
                            </div>
                        </div>
                        <button onclick="document.getElementById('taskModal').remove()" class="p-2 rounded-lg hover:bg-secondary"><i class="fa-solid fa-times text-muted-foreground"></i></button>
                    </div>
                </div>

                <div class="p-6 space-y-6">
                    <div>
                        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Descripcion</h3>
                        <p class="text-foreground">${this.escapeHtml(task.description || 'Sin descripcion disponible')}</p>
                    </div>

                    ${isCompleted ? `
                    <div class="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div class="flex items-center gap-3 mb-2">
                            <i class="fa-solid fa-check-circle text-green-500 text-xl"></i>
                            <h3 class="text-sm font-semibold text-green-400 uppercase tracking-wider">Tarea Completada</h3>
                        </div>
                        <p class="text-foreground text-sm">Esta tarea ha sido completada exitosamente por el agente ${agent ? agent.name : 'asignado'}. Todos los criterios de aceptacion han sido verificados.</p>
                        ${task.completion_notes ? `<p class="text-muted-foreground text-sm mt-2"><strong>Notas:</strong> ${this.escapeHtml(task.completion_notes)}</p>` : ''}
                    </div>
                    ` : ''}

                    <div>
                        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Progreso</h3>
                        <div class="flex items-center gap-4">
                            <div class="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                                <div class="h-full ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-solaria to-solaria-light'} rounded-full" style="width: ${task.progress || 0}%"></div>
                            </div>
                            <span class="text-lg font-bold ${isCompleted ? 'text-green-500' : 'text-solaria'}">${task.progress || 0}%</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-4 rounded-lg bg-secondary/50">
                            <p class="text-sm text-muted-foreground">Agente Asignado</p>
                            <p class="text-foreground font-medium">${agent ? agent.name : 'Sin asignar'}</p>
                            ${agent ? `<p class="text-xs text-muted-foreground">${agent.displayName}</p>` : ''}
                        </div>
                        <div class="p-4 rounded-lg bg-secondary/50">
                            <p class="text-sm text-muted-foreground">Horas Estimadas</p>
                            <p class="text-foreground font-medium">${task.estimated_hours || 0} horas</p>
                        </div>
                    </div>

                    ${!isCompleted ? `
                    <div>
                        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cambiar Prioridad</h3>
                        <div class="flex gap-2">
                            ${['critical', 'high', 'medium', 'low'].map(p => `
                                <button onclick="dashboard.updateTaskPriority(${task.id}, '${p}')" class="px-3 py-2 rounded-lg text-sm ${task.priority === p ? 'bg-solaria text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'}">${priorityLabels[p]}</button>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reasignar a Agente</h3>
                        <select class="w-full px-4 py-2 rounded-lg bg-secondary border border-border text-foreground" onchange="dashboard.reassignTask(${task.id}, this.value)">
                            <option value="">Sin asignar</option>
                            ${this.agentsData.map(a => `<option value="${a.id}" ${a.id === task.assigned_agent_id ? 'selected' : ''}>${a.name} - ${a.displayName}</option>`).join('')}
                        </select>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async updateTaskPriority(taskId, priority) {
        try {
            const response = await fetch(`${this.apiBase}/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority })
            });
            if (response.ok) {
                const task = this.tasksData.find(t => t.id === taskId);
                if (task) task.priority = priority;
                document.getElementById('taskModal')?.remove();
                this.showTaskDetail(taskId);
            }
        } catch (error) { console.error('Error updating task:', error); }
    }

    async reassignTask(taskId, agentId) {
        try {
            const response = await fetch(`${this.apiBase}/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_agent_id: agentId ? parseInt(agentId) : null })
            });
            if (response.ok) {
                const task = this.tasksData.find(t => t.id === taskId);
                if (task) task.assigned_agent_id = agentId ? parseInt(agentId) : null;
            }
        } catch (error) { console.error('Error reassigning task:', error); }
    }

    // Agents Section
    async loadAgents() {
        const container = document.getElementById('agentsGrid');
        if (!container) return;
        if (this.agentsData.length === 0) await this.fetchAgents();

        container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">${this.agentsData.map(agent => this.renderAgentCard(agent)).join('')}</div>`;
    }

    renderAgentCard(agent) {
        const assignedTasks = this.tasksData.filter(t => t.assigned_agent_id === agent.id);
        const completedTasks = assignedTasks.filter(t => t.status === 'completed').length;
        const successRate = assignedTasks.length > 0 ? Math.round((completedTasks / assignedTasks.length) * 100) : 0;

        const roleIcons = { project_manager: 'fa-user-tie', architect: 'fa-compass-drafting', developer: 'fa-code', tester: 'fa-vial', analyst: 'fa-chart-line', designer: 'fa-palette', devops: 'fa-server', technical_writer: 'fa-pen-nib', security_auditor: 'fa-shield-halved' };
        const roleColors = { project_manager: 'from-purple-500 to-purple-600', architect: 'from-blue-500 to-blue-600', developer: 'from-green-500 to-green-600', tester: 'from-yellow-500 to-yellow-600', analyst: 'from-cyan-500 to-cyan-600', designer: 'from-pink-500 to-pink-600', devops: 'from-orange-500 to-orange-600', technical_writer: 'from-indigo-500 to-indigo-600', security_auditor: 'from-red-500 to-red-600' };

        return `
            <div class="bg-card rounded-xl border border-border p-6 hover:border-solaria/30 transition-all cursor-pointer" onclick="dashboard.goToAgentDetail(${agent.id})">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${roleColors[agent.role] || 'from-gray-500 to-gray-600'} flex items-center justify-center">
                        <i class="fa-solid ${roleIcons[agent.role] || 'fa-robot'} text-white text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-foreground">${agent.name}</h3>
                        <p class="text-sm text-muted-foreground">${agent.displayName}</p>
                    </div>
                    <div class="flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}"></span>
                        <span class="text-xs ${agent.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}">${agent.status}</span>
                    </div>
                </div>
                <p class="text-sm text-muted-foreground mb-4 line-clamp-2">${this.getAgentDescription(agent.role).substring(0, 100)}...</p>
                <div class="grid grid-cols-2 gap-3">
                    <div class="p-3 rounded-lg bg-secondary/50 text-center"><p class="text-lg font-bold text-foreground">${assignedTasks.length}</p><p class="text-xs text-muted-foreground">Tareas</p></div>
                    <div class="p-3 rounded-lg bg-secondary/50 text-center"><p class="text-lg font-bold text-green-500">${successRate}%</p><p class="text-xs text-muted-foreground">Exito</p></div>
                </div>
                <button class="mt-4 w-full py-2 text-sm text-solaria hover:bg-solaria/10 rounded-lg transition-colors">Ver Detalles →</button>
            </div>
        `;
    }

    goToAgentDetail(agentId) {
        this.currentAgentId = agentId;
        this.showSection('agentDetail');
    }

    async loadAgentDetailPage() {
        let container = document.getElementById('agentDetailSection');
        if (!container) {
            const main = document.querySelector('main');
            const section = document.createElement('section');
            section.id = 'agentDetailSection';
            section.className = 'hidden';
            main.appendChild(section);
            container = section;
        }

        const agent = this.agentsData.find(a => a.id === this.currentAgentId);
        if (!agent) { container.innerHTML = '<p class="text-red-500">Agente no encontrado</p>'; return; }

        container.classList.remove('hidden');

        const assignedTasks = this.tasksData.filter(t => t.assigned_agent_id === agent.id);
        const completedTasks = assignedTasks.filter(t => t.status === 'completed');
        const inProgressTasks = assignedTasks.filter(t => t.status === 'in_progress');
        const pendingTasks = assignedTasks.filter(t => t.status === 'pending');
        const successRate = assignedTasks.length > 0 ? Math.round((completedTasks.length / assignedTasks.length) * 100) : 0;

        const roleIcons = { project_manager: 'fa-user-tie', architect: 'fa-compass-drafting', developer: 'fa-code', tester: 'fa-vial', analyst: 'fa-chart-line', designer: 'fa-palette', devops: 'fa-server', technical_writer: 'fa-pen-nib', security_auditor: 'fa-shield-halved' };

        document.getElementById('pageTitle').textContent = agent.name;
        document.getElementById('pageSubtitle').textContent = agent.displayName;

        container.innerHTML = `
            <div class="space-y-6">
                <button onclick="dashboard.showSection('agents')" class="flex items-center gap-2 text-muted-foreground hover:text-foreground"><i class="fa-solid fa-arrow-left"></i><span>Volver a Agentes</span></button>

                <div class="bg-card rounded-xl p-6 border border-border">
                    <div class="flex items-start gap-6">
                        <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-solaria to-solaria-dark flex items-center justify-center">
                            <i class="fa-solid ${roleIcons[agent.role] || 'fa-robot'} text-white text-4xl"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-4 mb-2">
                                <h1 class="text-3xl font-bold text-foreground">${agent.name}</h1>
                                <span class="flex items-center gap-1 px-3 py-1 rounded-full ${agent.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}">
                                    <span class="w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}"></span>${agent.status}
                                </span>
                            </div>
                            <p class="text-xl text-muted-foreground mb-4">${agent.displayName}</p>
                            <p class="text-foreground leading-relaxed max-w-3xl">${this.getAgentDescription(agent.role)}</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-5 gap-4">
                    <div class="bg-card rounded-xl p-6 border border-border text-center"><p class="text-3xl font-bold text-foreground">${assignedTasks.length}</p><p class="text-sm text-muted-foreground">Total</p></div>
                    <div class="bg-card rounded-xl p-6 border border-border text-center"><p class="text-3xl font-bold text-green-500">${completedTasks.length}</p><p class="text-sm text-muted-foreground">Completadas</p></div>
                    <div class="bg-card rounded-xl p-6 border border-border text-center"><p class="text-3xl font-bold text-blue-500">${inProgressTasks.length}</p><p class="text-sm text-muted-foreground">En Progreso</p></div>
                    <div class="bg-card rounded-xl p-6 border border-border text-center"><p class="text-3xl font-bold text-muted-foreground">${pendingTasks.length}</p><p class="text-sm text-muted-foreground">Pendientes</p></div>
                    <div class="bg-card rounded-xl p-6 border border-border text-center"><p class="text-3xl font-bold text-solaria">${successRate}%</p><p class="text-sm text-muted-foreground">Exito</p></div>
                </div>

                <div class="grid grid-cols-3 gap-6">
                    <div class="bg-card rounded-xl p-6 border border-border">
                        <h3 class="text-lg font-semibold text-foreground mb-4"><i class="fa-solid fa-star text-solaria mr-2"></i>Capacidades</h3>
                        <div class="flex flex-wrap gap-2">${this.getAgentCapabilities(agent.role).map(cap => `<span class="px-3 py-1 rounded-full text-sm bg-solaria/20 text-solaria">${cap}</span>`).join('')}</div>
                    </div>

                    <div class="bg-card rounded-xl p-6 border border-border col-span-2">
                        <h3 class="text-lg font-semibold text-foreground mb-4"><i class="fa-solid fa-tasks text-solaria mr-2"></i>Tareas Activas</h3>
                        <div class="space-y-3 max-h-64 overflow-y-auto">
                            ${inProgressTasks.concat(pendingTasks).slice(0, 8).map(task => `
                                <div class="p-4 rounded-lg bg-secondary/50 flex items-center justify-between hover:bg-secondary/70 cursor-pointer" onclick="dashboard.showTaskDetail(${task.id})">
                                    <div class="flex-1 min-w-0"><p class="font-medium text-foreground truncate">${this.escapeHtml(task.title)}</p><span class="text-xs px-2 py-0.5 rounded ${task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}">${task.status}</span></div>
                                    <span class="text-xs px-2 py-1 rounded ${task.priority === 'critical' ? 'bg-red-500/20 text-red-400' : task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'}">${task.priority}</span>
                                </div>
                            `).join('') || '<p class="text-muted-foreground">Sin tareas activas</p>'}
                        </div>
                    </div>
                </div>

                <div class="bg-card rounded-xl p-6 border border-border">
                    <h3 class="text-lg font-semibold text-foreground mb-4"><i class="fa-solid fa-exchange-alt text-solaria mr-2"></i>Reasignar Tareas</h3>
                    <p class="text-muted-foreground text-sm mb-4">Asigna tareas a ${agent.name}</p>
                    <div class="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                        ${this.tasksData.filter(t => t.assigned_agent_id !== agent.id && t.status !== 'completed').slice(0, 10).map(task => {
                            const currentAgent = this.agentsData.find(a => a.id === task.assigned_agent_id);
                            return `
                                <div class="p-3 rounded-lg bg-secondary/50 flex items-center justify-between">
                                    <div class="flex-1 min-w-0"><p class="text-sm text-foreground truncate">${this.escapeHtml(task.title)}</p><p class="text-xs text-muted-foreground">${currentAgent ? currentAgent.name : 'Sin asignar'}</p></div>
                                    <button onclick="dashboard.reassignTaskToAgent(${task.id}, ${agent.id})" class="px-3 py-1 text-xs rounded bg-solaria text-white hover:bg-solaria/90">Asignar</button>
                                </div>
                            `;
                        }).join('') || '<p class="text-muted-foreground col-span-2">No hay tareas disponibles</p>'}
                    </div>
                </div>

                <div class="bg-card rounded-xl p-6 border border-border">
                    <h3 class="text-lg font-semibold text-foreground mb-4"><i class="fa-solid fa-check-circle text-green-500 mr-2"></i>Tareas Completadas</h3>
                    <div class="grid grid-cols-2 gap-3">
                        ${completedTasks.slice(0, 8).map(task => `
                            <div class="p-3 rounded-lg bg-green-500/10 flex items-center gap-3 cursor-pointer" onclick="dashboard.showTaskDetail(${task.id})">
                                <i class="fa-solid fa-check-circle text-green-500"></i>
                                <p class="text-sm text-foreground truncate">${this.escapeHtml(task.title)}</p>
                            </div>
                        `).join('') || '<p class="text-muted-foreground">Sin tareas completadas</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    async reassignTaskToAgent(taskId, agentId) {
        try {
            const response = await fetch(`${this.apiBase}/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_agent_id: agentId })
            });
            if (response.ok) {
                const task = this.tasksData.find(t => t.id === taskId);
                if (task) task.assigned_agent_id = agentId;
                await this.loadAgentDetailPage();
            }
        } catch (error) { console.error('Error reassigning task:', error); }
    }

    // Tasks Section
    async loadTasks() {
        const container = document.getElementById('tasksList');
        if (!container) return;
        if (this.tasksData.length === 0) await this.fetchTasks();
        container.innerHTML = this.renderTaskListView();
    }

    // Docs Section
    async loadProjectDocs() {
        const container = document.getElementById('docsListContainer');
        if (!container) return;

        try {
            const response = await fetch(`${this.apiBase}/docs/list`, { headers: { 'Authorization': `Bearer ${this.token}` } });
            if (response.ok) {
                const data = await response.json();
                this.docsData = data.documents || [];
                this.renderDocsList();
            }
        } catch (error) { container.innerHTML = '<p class="text-red-500">Error cargando documentos</p>'; }
    }

    renderDocsList() {
        const container = document.getElementById('docsListContainer');
        if (!container) return;
        if (!this.docsData.length) { container.innerHTML = '<p class="text-muted-foreground">No se encontraron documentos</p>'; return; }

        const grouped = {};
        this.docsData.forEach(doc => { const type = doc.type || 'other'; if (!grouped[type]) grouped[type] = []; grouped[type].push(doc); });

        const typeLabels = { markdown: 'Documentacion', json: 'JSON', yaml: 'YAML', sql: 'SQL', docker: 'Docker', env: 'Config', other: 'Otros' };

        container.innerHTML = Object.entries(grouped).map(([type, docs]) => `
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">${typeLabels[type] || type}</h3>
                <div class="bg-card rounded-xl border border-border divide-y divide-border">
                    ${docs.map(doc => `
                        <a href="${doc.repoUrl}" target="_blank" rel="noopener" class="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                            <div class="w-10 h-10 rounded-lg bg-solaria/10 flex items-center justify-center"><i class="fa-solid ${doc.icon || 'fa-file'} text-solaria"></i></div>
                            <div class="flex-1 min-w-0"><p class="font-medium text-foreground">${this.escapeHtml(doc.name)}</p><p class="text-sm text-muted-foreground truncate">${doc.path}</p></div>
                            <div class="text-right shrink-0"><p class="text-sm text-muted-foreground">${this.formatFileSize(doc.size)}</p></div>
                            <i class="fa-solid fa-external-link text-muted-foreground"></i>
                        </a>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Analytics, Logs, Alerts
    async loadAnalyticsData() {
        const totalTasks = this.tasksData.length;
        const completed = this.tasksData.filter(t => t.status === 'completed').length;
        const avgProgress = totalTasks > 0 ? Math.round(this.tasksData.reduce((sum, t) => sum + (t.progress || 0), 0) / totalTasks) : 0;
        const activeAgents = this.agentsData.filter(a => a.status === 'active').length;

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('analyticsTotalTasks', totalTasks);
        set('analyticsCompletedTasks', completed);
        set('analyticsAvgProgress', avgProgress + '%');
        set('analyticsActiveAgents', activeAgents);

        this.renderProductivityChart();
        this.renderTasksByStatusChart();
        this.renderAgentPerformanceTable();
    }

    renderProductivityChart() {
        const ctx = document.getElementById('productivityChart');
        if (!ctx) return;
        if (this.charts.productivity) this.charts.productivity.destroy();

        const labels = []; const data = [];
        for (let i = 6; i >= 0; i--) { const date = new Date(); date.setDate(date.getDate() - i); labels.push(date.toLocaleDateString('es-ES', { weekday: 'short' })); data.push(Math.floor(Math.random() * 5) + 1); }

        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? '#27272a' : '#e5e7eb';
        const textColor = isDark ? '#a1a1aa' : '#6b7280';

        this.charts.productivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Tareas',
                    data,
                    borderColor: '#f6921d',
                    backgroundColor: 'rgba(246, 146, 29, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#f6921d',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        titleColor: isDark ? '#fafafa' : '#09090b',
                        bodyColor: isDark ? '#a1a1aa' : '#6b7280',
                        borderColor: isDark ? '#27272a' : '#e5e7eb',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    }

    renderTasksByStatusChart() {
        const ctx = document.getElementById('tasksByStatusChart');
        if (!ctx) return;
        if (this.charts.taskStatus) this.charts.taskStatus.destroy();

        const completed = this.tasksData.filter(t => t.status === 'completed').length;
        const inProgress = this.tasksData.filter(t => t.status === 'in_progress').length;
        const pending = this.tasksData.filter(t => t.status === 'pending').length;
        const blocked = this.tasksData.filter(t => t.status === 'blocked').length;

        const isDark = document.documentElement.classList.contains('dark');
        const labelColor = isDark ? '#a1a1aa' : '#6b7280';

        this.charts.taskStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completadas', 'En Progreso', 'Pendientes', 'Bloqueadas'],
                datasets: [{
                    data: [completed, inProgress, pending, blocked],
                    backgroundColor: ['#22c55e', '#3b82f6', '#9ca3af', '#ef4444'],
                    borderWidth: 0,
                    borderColor: isDark ? '#18181b' : '#ffffff',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: labelColor,
                            padding: 12,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        titleColor: isDark ? '#fafafa' : '#09090b',
                        bodyColor: isDark ? '#a1a1aa' : '#6b7280',
                        borderColor: isDark ? '#27272a' : '#e5e7eb',
                        borderWidth: 1
                    }
                },
                cutout: '60%'
            }
        });
    }

    renderAgentPerformanceTable() {
        const container = document.getElementById('agentPerformanceTable');
        if (!container) return;

        container.innerHTML = `
            <table class="w-full">
                <thead><tr class="border-b border-border"><th class="text-left py-3 text-sm font-medium text-muted-foreground">Agente</th><th class="text-center py-3 text-sm font-medium text-muted-foreground">Tareas</th><th class="text-center py-3 text-sm font-medium text-muted-foreground">Completadas</th><th class="text-center py-3 text-sm font-medium text-muted-foreground">Exito</th></tr></thead>
                <tbody>
                    ${this.agentsData.map(agent => {
                        const tasks = this.tasksData.filter(t => t.assigned_agent_id === agent.id);
                        const completed = tasks.filter(t => t.status === 'completed').length;
                        const rate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                        return `
                            <tr class="border-b border-border/50 hover:bg-secondary/30 cursor-pointer" onclick="dashboard.goToAgentDetail(${agent.id})">
                                <td class="py-3"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-solaria/10 flex items-center justify-center"><i class="fa-solid fa-robot text-solaria text-sm"></i></div><span class="text-foreground">${agent.name}</span></div></td>
                                <td class="text-center text-foreground">${tasks.length}</td>
                                <td class="text-center text-green-500">${completed}</td>
                                <td class="text-center"><span class="${rate >= 70 ? 'text-green-500' : rate >= 40 ? 'text-yellow-500' : 'text-red-500'}">${rate}%</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    async loadActivityLogs() {
        const container = document.getElementById('logsContainer');
        if (!container) return;

        try {
            const response = await fetch(`${this.apiBase}/logs?limit=50`, { headers: { 'Authorization': `Bearer ${this.token}` } });
            if (response.ok) { this.logsData = await response.json(); this.renderLogs(this.logsData); }
        } catch (error) { container.innerHTML = '<p class="p-4 text-red-500">Error cargando logs</p>'; }
    }

    renderLogs(logs) {
        const container = document.getElementById('logsContainer');
        if (!container) return;
        if (!logs.length) { container.innerHTML = '<p class="p-4 text-muted-foreground">No hay logs</p>'; return; }

        const levelColors = { info: 'text-blue-500', warning: 'text-yellow-500', error: 'text-red-500', critical: 'text-red-600', debug: 'text-gray-500' };

        container.innerHTML = logs.slice(0, 50).map(log => `
            <div class="p-4 flex items-start gap-4 hover:bg-secondary/30">
                <span class="text-xs ${levelColors[log.level] || ''} uppercase font-mono w-16 shrink-0">${log.level}</span>
                <div class="flex-1 min-w-0"><p class="text-sm text-foreground">${this.escapeHtml(log.action)}</p><p class="text-xs text-muted-foreground mt-1">${log.agent_name || 'Sistema'}</p></div>
                <span class="text-xs text-muted-foreground shrink-0">${new Date(log.created_at).toLocaleString('es-ES')}</span>
            </div>
        `).join('');
    }

    filterLogs() {
        const level = document.getElementById('logsLevelFilter')?.value;
        if (!this.logsData.length) return;
        this.renderLogs(level === 'all' ? this.logsData : this.logsData.filter(log => log.level === level));
    }

    async loadAlerts() {
        const container = document.getElementById('alertsContainer');
        if (!container) return;

        try {
            const response = await fetch(`${this.apiBase}/dashboard/alerts?limit=50`, { headers: { 'Authorization': `Bearer ${this.token}` } });
            if (response.ok) { const alerts = await response.json(); this.renderAlerts(alerts); }
        } catch (error) { container.innerHTML = '<p class="text-red-500">Error</p>'; }
    }

    renderAlerts(alerts) {
        const container = document.getElementById('alertsContainer');
        if (!container) return;
        if (!alerts.length) { container.innerHTML = '<div class="p-6 text-center"><i class="fa-solid fa-check-circle text-green-500 text-3xl mb-2"></i><p class="text-muted-foreground">Sin alertas</p></div>'; return; }

        container.innerHTML = alerts.map(alert => `<div class="p-4 rounded-lg border-l-4 border-l-${alert.severity === 'critical' ? 'red' : 'yellow'}-500 bg-${alert.severity === 'critical' ? 'red' : 'yellow'}-500/5 mb-3"><p class="font-medium text-foreground">${this.escapeHtml(alert.title)}</p><p class="text-sm text-muted-foreground mt-1">${this.escapeHtml(alert.message)}</p></div>`).join('');
    }

    // C-Suite Dashboards (simplified)
    async loadCEODashboard() {
        const totalTasks = this.tasksData.length;
        const completed = this.tasksData.filter(t => t.status === 'completed').length;
        const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

        const el = document.getElementById('ceoKpis');
        if (el) el.innerHTML = `<div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-foreground">${progress}%</p><p class="text-sm text-muted-foreground">Progreso</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-green-500">$150K</p><p class="text-sm text-muted-foreground">Presupuesto</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-blue-500">${this.agentsData.filter(a => a.status === 'active').length}</p><p class="text-sm text-muted-foreground">Agentes</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-solaria">${totalTasks}</p><p class="text-sm text-muted-foreground">Tareas</p></div>`;

        const summary = document.getElementById('ceoProjectSummary');
        if (summary) summary.innerHTML = `<p class="text-foreground">Akademate.com - ${progress}%</p><div class="w-full h-3 bg-secondary rounded-full mt-2"><div class="h-full bg-solaria rounded-full" style="width:${progress}%"></div></div>`;

        const decisions = document.getElementById('ceoDecisions'); if (decisions) decisions.innerHTML = '<p class="text-muted-foreground">Sin decisiones pendientes</p>';
        const execSummary = document.getElementById('ceoExecutiveSummary'); if (execSummary) execSummary.innerHTML = `<p>Proyecto con ${this.agentsData.filter(a => a.status === 'active').length} agentes activos.</p>`;
    }

    async loadCTODashboard() {
        const el = document.getElementById('ctoKpis');
        if (el) el.innerHTML = `<div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-foreground">75%</p><p class="text-sm text-muted-foreground">Cobertura</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-yellow-500">Media</p><p class="text-sm text-muted-foreground">Deuda</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-green-500">A</p><p class="text-sm text-muted-foreground">Calidad</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-blue-500">${this.tasksData.filter(t => t.status === 'in_progress').length}</p><p class="text-sm text-muted-foreground">En Dev</p></div>`;
        const stack = document.getElementById('ctoTechStack'); if (stack) stack.innerHTML = '<p class="text-foreground">Next.js 15 + Payload CMS + PostgreSQL</p>';
        const arch = document.getElementById('ctoArchitecture'); if (arch) arch.innerHTML = '<p class="text-foreground">Multi-tenant SaaS</p>';
        const quality = document.getElementById('ctoCodeQuality'); if (quality) quality.innerHTML = '<p class="text-green-500">All checks passing</p>';
        const debt = document.getElementById('ctoTechDebt'); if (debt) debt.innerHTML = '<p class="text-muted-foreground">2 items</p>';
        const perf = document.getElementById('ctoAgentPerformance'); if (perf) perf.innerHTML = '<p class="text-foreground">OK</p>';
    }

    async loadCOODashboard() {
        const pending = this.tasksData.filter(t => t.status === 'pending').length;
        const inProgress = this.tasksData.filter(t => t.status === 'in_progress').length;
        const el = document.getElementById('cooKpis');
        if (el) el.innerHTML = `<div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-foreground">${this.tasksData.length}</p><p class="text-sm text-muted-foreground">Total</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-blue-500">${inProgress}</p><p class="text-sm text-muted-foreground">En Prog.</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-green-500">94%</p><p class="text-sm text-muted-foreground">Util.</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-muted-foreground">${pending}</p><p class="text-sm text-muted-foreground">Pendientes</p></div>`;
        const status = document.getElementById('cooTaskStatus'); if (status) status.innerHTML = '<p class="text-foreground">Normal</p>';
        const util = document.getElementById('cooAgentUtilization'); if (util) util.innerHTML = '<p class="text-foreground">94%</p>';
        const bottle = document.getElementById('cooBottlenecks'); if (bottle) bottle.innerHTML = '<p class="text-green-500">Sin bloqueos</p>';
        const miles = document.getElementById('cooMilestones'); if (miles) miles.innerHTML = '<p class="text-foreground">Infraestructura</p>';
    }

    async loadCFODashboard() {
        const el = document.getElementById('cfoKpis');
        if (el) el.innerHTML = `<div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-foreground">$150K</p><p class="text-sm text-muted-foreground">Total</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-green-500">$45K</p><p class="text-sm text-muted-foreground">Gastado</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-blue-500">$12K/m</p><p class="text-sm text-muted-foreground">Burn</p></div><div class="stat-card rounded-xl p-4"><p class="text-2xl font-bold text-solaria">8m</p><p class="text-sm text-muted-foreground">Runway</p></div>`;
        const breakdown = document.getElementById('cfoBudgetBreakdown'); if (breakdown) breakdown.innerHTML = '<p class="text-foreground">30% utilizado</p>';
        const cost = document.getElementById('cfoCostByProject'); if (cost) cost.innerHTML = '<p class="text-solaria">Akademate: $45K</p>';
        const approvals = document.getElementById('cfoApprovals'); if (approvals) approvals.innerHTML = '<p class="text-muted-foreground">Sin pendientes</p>';
        const alerts = document.getElementById('cfoFinancialAlerts'); if (alerts) alerts.innerHTML = '<p class="text-green-500">OK</p>';
    }

    // Utility
    showLoading(show) { const overlay = document.getElementById('loadingOverlay'); if (overlay) overlay.classList.toggle('hidden', !show); }
    showError(elementId, message) { const el = document.getElementById(elementId); if (el) { el.textContent = message; el.classList.remove('hidden'); } }
    escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

    initializeSocket() {
        try {
            this.socket = io();
            this.socket.on('connect', () => console.log('Socket connected'));
            this.socket.on('task:updated', () => this.fetchTasks());
            this.socket.on('agent:updated', () => this.fetchAgents());
        } catch (error) { console.log('Socket not available'); }
    }

    startRealTimeUpdates() { this.refreshInterval = setInterval(() => { this.fetchTasks(); this.fetchAgents(); }, 60000); }
}

// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('userId').value;
            const password = document.getElementById('password').value;
            await dashboard.login(userId, password);
        });
    }
});

function logout() { if (dashboard) dashboard.logout(); }
function refreshAgents() { if (dashboard) dashboard.fetchAgents().then(() => dashboard.loadAgents()); }

const dashboard = new SolariaDashboard();
