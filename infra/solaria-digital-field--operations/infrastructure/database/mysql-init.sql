-- SOLARIA Digital Field Operations - Database Initialization
-- Version: 2.0.0
-- Purpose: C-Suite Dashboard with CEO/CTO/COO/CFO views

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Users table for C-Suite access
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('ceo', 'cto', 'coo', 'cfo', 'admin', 'viewer') NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    client VARCHAR(200),
    description TEXT,
    status ENUM('planning', 'development', 'testing', 'deployment', 'completed', 'on_hold', 'cancelled') DEFAULT 'planning',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    budget DECIMAL(15, 2) DEFAULT 0,
    actual_cost DECIMAL(15, 2) DEFAULT 0,
    completion_percentage INT DEFAULT 0,
    start_date DATE,
    deadline DATE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Agents table
CREATE TABLE IF NOT EXISTS ai_agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role ENUM('project_manager', 'architect', 'developer', 'tester', 'analyst', 'designer', 'devops', 'technical_writer', 'security_auditor', 'deployment_specialist') NOT NULL,
    status ENUM('active', 'busy', 'inactive', 'error', 'maintenance') DEFAULT 'inactive',
    capabilities JSON,
    configuration JSON,
    last_activity TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agent States table (real-time status)
CREATE TABLE IF NOT EXISTS agent_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_task TEXT,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performance_metrics JSON,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    project_id INT,
    agent_id INT,
    assigned_agent_id INT,
    assigned_by INT,
    status ENUM('pending', 'in_progress', 'review', 'completed', 'blocked', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    estimated_hours DECIMAL(6, 2),
    actual_hours DECIMAL(6, 2),
    progress INT DEFAULT 0,
    deadline DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_project (project_id),
    INDEX idx_agent (agent_id),
    INDEX idx_status (status),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_agent_id) REFERENCES ai_agents(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active',
    project_id INT,
    agent_id INT,
    task_id INT,
    acknowledged_by INT,
    acknowledged_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project Metrics table
CREATE TABLE IF NOT EXISTS project_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    metric_date DATE NOT NULL,
    completion_percentage DECIMAL(5, 2) DEFAULT 0,
    agent_efficiency DECIMAL(5, 2) DEFAULT 0,
    code_quality_score DECIMAL(5, 2) DEFAULT 0,
    test_coverage DECIMAL(5, 2) DEFAULT 0,
    total_hours_worked DECIMAL(8, 2) DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    tasks_pending INT DEFAULT 0,
    tasks_blocked INT DEFAULT 0,
    budget_used DECIMAL(15, 2) DEFAULT 0,
    performance_score DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_project_date (project_id, metric_date),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agent Metrics table
CREATE TABLE IF NOT EXISTS agent_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_agent (agent_id),
    INDEX idx_type (metric_type),
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    agent_id INT,
    task_id INT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    category ENUM('development', 'testing', 'deployment', 'management', 'security', 'system') DEFAULT 'system',
    level ENUM('debug', 'info', 'warning', 'error', 'critical') DEFAULT 'info',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project (project_id),
    INDEX idx_agent (agent_id),
    INDEX idx_category (category),
    INDEX idx_level (level),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default C-Suite users
-- Password: SolariaAdmin2024! -> SHA256 hash
-- IMPORTANT: Change these passwords immediately after first login in production!
INSERT INTO users (username, email, password_hash, name, role, is_active) VALUES
('carlosjperez', 'carlos@solaria.agency', 'a8d3ca85c348198c863daaa1af3b13af4aba6bbf414c32a77efe02b447ad93b8', 'Carlos J. Perez', 'ceo', TRUE),
('cto_solaria', 'cto@solaria.agency', 'a8d3ca85c348198c863daaa1af3b13af4aba6bbf414c32a77efe02b447ad93b8', 'CTO SOLARIA', 'cto', TRUE),
('coo_solaria', 'coo@solaria.agency', 'a8d3ca85c348198c863daaa1af3b13af4aba6bbf414c32a77efe02b447ad93b8', 'COO SOLARIA', 'coo', TRUE),
('cfo_solaria', 'cfo@solaria.agency', 'a8d3ca85c348198c863daaa1af3b13af4aba6bbf414c32a77efe02b447ad93b8', 'CFO SOLARIA', 'cfo', TRUE),
('admin', 'admin@solaria.agency', 'a8d3ca85c348198c863daaa1af3b13af4aba6bbf414c32a77efe02b447ad93b8', 'System Admin', 'admin', TRUE);

-- Insert AI Agents
INSERT INTO ai_agents (name, role, status, capabilities, last_activity) VALUES
('NEMESIS-PM', 'project_manager', 'active', '{"planning": true, "coordination": true, "reporting": true}', NOW()),
('NEMESIS-ARCH', 'architect', 'active', '{"system_design": true, "tech_decisions": true, "documentation": true}', NOW()),
('NEMESIS-DEV-01', 'developer', 'active', '{"frontend": true, "backend": true, "database": true}', NOW()),
('NEMESIS-DEV-02', 'developer', 'active', '{"frontend": true, "backend": true, "api": true}', NOW()),
('NEMESIS-TST', 'tester', 'active', '{"unit_testing": true, "integration_testing": true, "e2e_testing": true}', NOW()),
('NEMESIS-ANL', 'analyst', 'active', '{"requirements": true, "business_logic": true, "data_analysis": true}', NOW()),
('NEMESIS-DSN', 'designer', 'active', '{"ui_design": true, "ux_design": true, "prototyping": true}', NOW()),
('NEMESIS-OPS', 'devops', 'active', '{"ci_cd": true, "infrastructure": true, "monitoring": true}', NOW()),
('NEMESIS-DOC', 'technical_writer', 'active', '{"documentation": true, "api_docs": true, "user_guides": true}', NOW()),
('NEMESIS-SEC', 'security_auditor', 'active', '{"code_review": true, "vulnerability_scan": true, "compliance": true}', NOW());

-- Insert Agent States
INSERT INTO agent_states (agent_id, status, current_task, last_heartbeat) VALUES
(1, 'active', 'Monitoring project progress', NOW()),
(2, 'active', 'Reviewing system architecture', NOW()),
(3, 'busy', 'Implementing dashboard features', NOW()),
(4, 'active', 'Code review pending', NOW()),
(5, 'active', 'Running automated tests', NOW()),
(6, 'active', 'Analyzing requirements', NOW()),
(7, 'active', 'Updating UI components', NOW()),
(8, 'busy', 'Deploying to staging', NOW()),
(9, 'active', 'Updating documentation', NOW()),
(10, 'active', 'Security audit in progress', NOW());

-- Insert demo project
INSERT INTO projects (name, client, description, status, priority, budget, actual_cost, completion_percentage, start_date, deadline, created_by) VALUES
('SOLARIA Digital Field Operations', 'SOLARIA AGENCY', 'Digital Construction Field Office - Oficina de construccion autocontenida y desmantelable', 'development', 'high', 250000.00, 45000.00, 45, '2025-12-01', '2026-03-31', 1);

-- Insert demo tasks
INSERT INTO tasks (title, description, project_id, agent_id, assigned_agent_id, status, priority, estimated_hours, actual_hours, progress) VALUES
('Setup Docker infrastructure', 'Configure Docker containers for all services', 1, 8, 8, 'completed', 'high', 8, 6, 100),
('Implement C-Suite Dashboard', 'Create CEO/CTO/COO/CFO dashboard views', 1, 3, 3, 'in_progress', 'critical', 40, 25, 75),
('Design database schema', 'Create MySQL schema for construction office', 1, 2, 2, 'completed', 'high', 16, 12, 100),
('Implement Quick Access', 'Add bypass authentication for development', 1, 3, 3, 'completed', 'medium', 4, 3, 100),
('Write Playwright tests', 'Create exhaustive E2E tests', 1, 5, 5, 'pending', 'high', 16, 0, 0),
('Security audit', 'Review authentication and authorization', 1, 10, 10, 'pending', 'high', 8, 0, 0);

-- Insert sample metrics
INSERT INTO project_metrics (project_id, metric_date, completion_percentage, agent_efficiency, code_quality_score, test_coverage, total_hours_worked, tasks_completed, tasks_pending, budget_used) VALUES
(1, CURDATE() - INTERVAL 7 DAY, 20, 85.5, 78.0, 45.0, 40, 2, 8, 15000),
(1, CURDATE() - INTERVAL 6 DAY, 25, 87.0, 80.0, 50.0, 48, 3, 7, 18000),
(1, CURDATE() - INTERVAL 5 DAY, 30, 88.5, 82.0, 55.0, 56, 4, 6, 22000),
(1, CURDATE() - INTERVAL 4 DAY, 35, 89.0, 83.0, 60.0, 64, 5, 5, 28000),
(1, CURDATE() - INTERVAL 3 DAY, 38, 90.0, 84.0, 62.0, 72, 5, 5, 32000),
(1, CURDATE() - INTERVAL 2 DAY, 42, 91.0, 85.0, 65.0, 80, 6, 4, 38000),
(1, CURDATE() - INTERVAL 1 DAY, 44, 91.5, 86.0, 68.0, 88, 6, 4, 42000),
(1, CURDATE(), 45, 92.0, 87.0, 70.0, 96, 7, 3, 45000);

-- Insert sample alerts
INSERT INTO alerts (title, message, severity, status, project_id, agent_id) VALUES
('High memory usage', 'Agent NEMESIS-DEV-01 memory usage exceeds 80%', 'medium', 'active', 1, 3),
('Deployment successful', 'Staging environment updated successfully', 'low', 'resolved', 1, 8);

-- Insert activity logs
INSERT INTO activity_logs (project_id, agent_id, action, details, category, level) VALUES
(1, 1, 'project_started', 'Project SOLARIA Digital Field Operations initialized', 'management', 'info'),
(1, 3, 'code_committed', 'Dashboard UI implementation committed', 'development', 'info'),
(1, 8, 'deployment_started', 'Initiating deployment to staging', 'deployment', 'info'),
(1, 5, 'tests_passed', 'All unit tests passed (45/45)', 'testing', 'info'),
(1, 10, 'security_scan', 'Security scan completed - no critical issues', 'security', 'info');

-- Grant permissions
GRANT ALL PRIVILEGES ON solaria_construction.* TO 'solaria_user'@'%';
FLUSH PRIVILEGES;
