# SOLARIA Digital Field Operations

**Oficina Digital de Construccion en Campo** - Version 2.0.0

Sistema autocontenido para gestion de proyectos de software con supervision ejecutiva (CEO/CTO/COO/CFO).

## Inicio Rápido (oficina single-container recomendada)

```bash
# Levantar oficina completa (MariaDB + dashboard)
docker compose -f docker-compose.single.yml up -d

# Poblar con proyecto Akademate
pnpm ingest-akademate

# Checks
pnpm health
pnpm test:ui:dfo   # smoke UI/API con Playwright

# Acceso dashboard
http://localhost:3030  (user: carlosjperez / pass: SolariaAdmin2024!)
```

> Runbook detallado: `docs/runbooks/office.md`

---

## Descripcion General

SOLARIA Digital Field Operations es un sistema de gestion de proyectos avanzado disenado para equipos de desarrollo de software. Combina agentes IA, analiticas en tiempo real y workflows automatizados.

### Key Features

- **AI Agent Coordination**: Virtual agents for specialized development tasks
- **Real-time Dashboard**: Live project monitoring and analytics
- **Automated Project Analysis**: Repository scanning and configuration
- **Task Management**: Intelligent task assignment and tracking
- **Performance Metrics**: Comprehensive KPIs and analytics
- **WebSocket Integration**: Real-time updates and collaboration

## 🏗️ Architecture

### Core Components

#### AI Agents
- **Project Manager**: Overall project coordination and planning
- **Architect**: System design and technical architecture
- **Developer**: Code implementation and feature development
- **Tester**: Quality assurance and automated testing
- **Analyst**: Requirements analysis and metrics reporting
- **DevOps**: Deployment and infrastructure management

#### Technology Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express + Socket.IO
- **Database**: SQLite with RESTful API
- **Real-time**: WebSocket communication
- **Containerization**: Docker + Docker Compose

#### External AI Integration
- **Claude Code**: Advanced code generation and architecture
- **GitHub Copilot**: Intelligent code assistance
- **OpenAI Codex**: Automated code completion
- **ChatGPT**: Documentation and analysis

## 🚀 Workflow

### 1. Repository Analysis
```bash
# Automated repository analysis and setup
npm run auto-deploy --repo=https://github.com/user/project
```

### 2. Project Configuration
- **Documentation Analysis**: README.md and technical docs parsing
- **Project Type Detection**: Web, mobile, backend, or full-stack identification
- **Requirements Extraction**: Automated specification gathering
- **Agent Team Setup**: Specialized AI agent configuration
- **Metrics Configuration**: Custom KPIs and analytics setup

### 3. Dashboard Management
- **Task Board**: Visual project management interface
- **Progress Analytics**: Real-time charts and metrics
- **Team Collaboration**: Agent coordination and communication
- **Issue Tracking**: Bug and feature request management
- **Performance Reports**: Comprehensive analytics dashboard

### 4. AI Agent Execution
Agents provide automated assistance for:
- **Task Assignment**: Intelligent workload distribution
- **Feature Development**: Automated code generation
- **Bug Resolution**: Automated debugging and fixes
- **Documentation**: Auto-generated technical documentation
- **Cross-agent Coordination**: Collaborative problem solving

## 📁 Project Structure

```
solaria-digital-field-operations/
├── backend/                     # Node.js API Server
│   ├── server.js               # Main application server
│   └── package.json            # Backend dependencies
├── frontend/                    # React Dashboard
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Dashboard pages
│   │   ├── contexts/          # React contexts
│   │   └── main.jsx           # Application entry point
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── scripts/                     # Automation Scripts
│   ├── ai-agent-coordinator.js # Agent management system
│   ├── auto-deploy.js          # Repository deployment
│   ├── project-analyzer.js     # Code analysis tools
│   └── agent-setup.js          # Agent configuration
├── docker-compose.yml           # Container orchestration
├── package.json                # Root package configuration
└── README.md                   # Project documentation
```

## 📊 Dashboard Features

### Task Management
```javascript
// Task structure with intelligent assignment
const tasks = [
  {
    id: 'TASK-001',
    title: 'Implement authentication API',
    type: 'feature',
    status: 'in-progress',
    assignee: 'developer-agent',
    priority: 'high',
    estimated: '3 days',
    technologies: ['nodejs', 'express', 'jwt'],
    dependencies: ['database-schema-design']
  },
  {
    id: 'TASK-002', 
    title: 'Fix login validation bug',
    type: 'bug',
    status: 'identified',
    assignee: 'tester-agent',
    priority: 'critical',
    estimated: '1 day',
    affected: 'authentication-module'
  }
];
```

### Analytics & Metrics
- **Development Velocity**: Features completed per sprint
- **Quality Metrics**: Test coverage and bug resolution rates
- **Performance Analytics**: System response times and resource usage
- **Team Productivity**: Agent efficiency and task completion rates

### Agent Management
- **Active Agents**: Real-time AI agent status monitoring
- **Performance Tracking**: Individual agent productivity metrics
- **Task Assignment**: Intelligent workload distribution
- **Collaboration**: Cross-agent communication and coordination

## 🔌 AI Integration

### Claude Code Integration
```javascript
const claudeIntegration = {
  endpoint: 'https://api.anthropic.com/v1',
  model: 'claude-3-opus-20240229',
  capabilities: [
    'code_generation',
    'architecture_design', 
    'debugging',
    'documentation',
    'code_review'
  ],
  taskTypes: [
    'feature_development',
    'bug_fixing',
    'code_refactoring',
    'technical_design'
  ]
};
```

### GitHub Copilot Integration
```javascript
const copilotIntegration = {
  endpoint: 'github-copilot-api',
  capabilities: [
    'code_completion',
    'suggestion_generation',
    'pattern_recognition'
  ],
  context: 'full_project_context'
};
```

## 🚀 Auto-Deployment System

### Automated Workflow
1. **Repository Cloning**: Secure project download
2. **Structure Analysis**: Technology stack identification
3. **Dashboard Configuration**: Customized setup
4. **Agent Deployment**: AI assistant activation
5. **Task Board Creation**: Issue/task import
6. **Metrics Setup**: KPI configuration
7. **System Activation**: Ready-to-use dashboard

### Web App Deployment Example
```bash
# Deploy web application project
npm run auto-deploy \
  --repo=https://github.com/company/my-web-app \
  --type=web-app \
  --team-size=5 \
  --timeline=8-weeks

# Results:
✅ Analyzed: React + Node.js + MongoDB
✅ Configured: Web development dashboard
✅ Activated: 5 specialized AI agents
✅ Imported: 47 tasks from GitHub Issues
✅ Established: Web development metrics
✅ Ready: Active digital management system
```

### Use Cases

#### New Web Project
```bash
npm run auto-deploy --repo=https://github.com/startup/saas-app

# Automatic configuration:
- React + TypeScript + Node.js detection
- Web development agent setup
- GitHub issues task board creation
- Web development metrics establishment
- Claude/Copilot integration preparation
```

#### Legacy System Migration
```bash
npm run auto-deploy --repo=https://github.com/company/legacy-system

# System capabilities:
- Existing code analysis
- Technical debt identification
- Refactoring planning
- Modernization agent assignment
- Migration metrics establishment
```

#### Distributed Team Setup
```bash
npm run auto-deploy --repo=https://github.com/org/distributed-app --team=remote

# Remote team features:
- Remote work agent configuration
- Communication channel setup
- Productivity dashboard creation
- Collaboration tool integration
- Distributed progress monitoring
```

## ⚙️ Agent Configuration

### Developer Agent
```json
{
  "name": "Developer Agent",
  "role": "software_development",
  "ai_integration": "claude-code",
  "capabilities": [
    "feature_development",
    "bug_fixing", 
    "code_refactoring",
    "testing",
    "documentation"
  ],
  "task_types": [
    "build_new_feature",
    "fix_bug",
    "optimize_performance",
    "write_tests",
    "update_documentation"
  ],
  "tools": [
    "vscode",
    "git",
    "npm/yarn",
    "testing_frameworks",
    "claude_code"
  ],
  "metrics": [
    "features_completed",
    "bugs_fixed",
    "code_quality",
    "test_coverage",
    "documentation_completeness"
  ]
}
```

### Architect Agent
```json
{
  "name": "Architect Agent", 
  "role": "software_architecture",
  "ai_integration": "claude-opus",
  "capabilities": [
    "system_design",
    "architecture_planning",
    "technology_selection",
    "api_design",
    "database_design"
  ],
  "deliverables": [
    "architecture_diagrams",
    "technical_specifications", 
    "api_documentation",
    "database_schemas",
    "deployment_strategies"
  ]
}
```

## 📈 Metrics & KPIs

### Development Metrics
- **Velocity**: Features completed per sprint
- **Burndown**: Remaining work tracking
- **Quality Gates**: Test pass/fail rates
- **Bug Rate**: Bugs per feature ratio
- **Code Coverage**: Test coverage percentage
- **Deployment Frequency**: Weekly deployment count
- **Performance**: Response time metrics

### Real-time Dashboard
```javascript
const realTimeStatus = {
  project_phase: 'backend-development',
  progress: {
    completed: 65,
    in_progress: 25,
    pending: 10
  },
  agents: {
    active: 5,
    current_tasks: 3,
    completed_today: 12
  },
  quality: {
    tests_passed: 89,
    code_coverage: 78,
    bugs_open: 3
  },
  timeline: {
    current_sprint: 'Sprint-12',
    days_remaining: 8,
    on_track: true
  }
};
```

## 🎨 User Interface

### Design System
- **Modern Theme**: Professional dark mode interface
- **Task Cards**: Interactive task management
- **Progress Visualization**: Real-time progress bars
- **Team Management**: Agent status displays
- **Milestone Tracking**: Project milestone visualization

### Visual Elements
- **Status Indicators**: Real-time status updates
- **Progress Metrics**: Visual progress tracking
- **Agent Avatars**: AI agent representations
- **Technical Documentation**: Integrated documentation view
- **Analytics Dashboard**: Comprehensive metrics display

## 🚀 Quick Start

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/SOLARIA-AGENCY/solaria-digital-field-operations.git
cd solaria-digital-field-operations

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Start the application
npm run dev
```

### Auto-Deploy Your Project
```bash
# Deploy system for your project
npm run auto-deploy --repo=YOUR_REPOSITORY_URL

# Access the dashboard
http://localhost:3000
```

### Development Mode
```bash
# Start development servers
npm run dev

# Access points:
# Dashboard: http://localhost:3000
# API: http://localhost:3001/api
# Real-time: WebSocket on port 3001
```

### Docker Deployment
```bash
# Using Docker Compose
docker-compose up -d

# Access the application
http://localhost:3000
```

## 📚 Documentation

- [User Guide](./docs/user-guide.md) - Complete user documentation
- [Agent Configuration](./docs/agents.md) - AI agent setup and management
- [API Reference](./docs/api.md) - REST API documentation
- [Development Guide](./docs/development.md) - Contributor guidelines

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=./solaria_dfo.db

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000

# AI Services
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GITHUB_TOKEN=your_github_token
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**SOLARIA Digital Field Operations** - *AI-Powered Project Management*

© 2024 SOLARIA AGENCY. All rights reserved.
