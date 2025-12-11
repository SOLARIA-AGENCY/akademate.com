#!/usr/bin/env node

/**
 * SOLARIA Agent Setup System
 * 
 * Configures AI agents with full project context including:
 * - Project specifications and requirements
 * - Current construction phase and status
 * - Team structure and communication channels
 * - Document access and editing permissions
 * - Decision-making authority and protocols
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');

class AgentSetup {
    constructor(projectPath, projectConfig) {
        this.projectPath = projectPath;
        this.projectConfig = projectConfig;
        this.agentsPath = path.join(projectPath, 'agents');
        this.agents = {};
    }

    async setupAllAgents() {
        console.log('🤖 Setting up AI Agent Team...');

        try {
            // Create agents directory
            await fs.ensureDir(this.agentsPath);

            // Setup each agent type
            await this.setupProjectManager();
            await this.setupArchitect();
            await this.setupFieldSupervisor();
            await this.setupQualityControl();
            await this.setupDocumentManager();
            await this.setupSafetyOfficer();

            // Create agent coordination configuration
            await this.setupAgentCoordination();

            // Generate agent startup scripts
            await this.generateAgentScripts();

            console.log('✅ AI Agent Team setup complete');

        } catch (error) {
            console.error('❌ Agent setup failed:', error.message);
            throw error;
        }
    }

    async setupProjectManager() {
        console.log('👷 Configuring Project Manager Agent...');

        const agentConfig = {
            name: 'Project Manager Agent',
            type: 'project-manager',
            version: '1.0.0',
            
            // Core Configuration
            role: 'coordination',
            authority: 'high',
            access_level: 'all',
            communication_frequency: 'daily',
            
            // Decision Scope
            decision_scope: [
                'budget_allocation',
                'timeline_adjustments',
                'resource_assignment',
                'risk_management',
                'team_coordination',
                'stakeholder_communication'
            ],
            
            // KPI Metrics
            kpi_metrics: [
                'project_progress',
                'budget_utilization',
                'quality_scores',
                'safety_incidents',
                'team_productivity',
                'stakeholder_satisfaction'
            ],
            
            // Project Context
            project_context: {
                project_name: this.projectConfig.projectName,
                project_type: this.projectConfig.projectType,
                current_phase: this.projectConfig.currentPhase,
                budget: parseFloat(this.projectConfig.budget),
                timeline: parseInt(this.projectConfig.timeline),
                team_size: this.projectConfig.teamSize || 10,
                stakeholders: this.projectConfig.stakeholders || []
            },
            
            // Communication Protocols
            communication: {
                daily_standup: '09:00 UTC',
                weekly_report: 'Friday 16:00 UTC',
                monthly_review: 'Last Friday of month',
                escalation_threshold: 'high_priority_issues',
                notification_channels: ['email', 'slack', 'dashboard']
            },
            
            // Decision Authority
            authority_matrix: {
                budget_decisions: 'up_to_5_percent',
                timeline_changes: 'up_to_1_week',
                resource_allocation: 'full_authority',
                risk_mitigation: 'immediate_action',
                team_changes: 'approval_required'
            },
            
            // Integration Points
            integrations: {
                accounting_system: 'quickbooks',
                project_management: 'primavera',
                document_management: 'sharepoint',
                communication: 'microsoft_teams',
                reporting: 'power_bi'
            },
            
            // AI Configuration
            ai_config: {
                model: 'gpt-4',
                temperature: 0.3,
                max_tokens: 4000,
                response_style: 'professional_decisive',
                context_window: 'full_project_history',
                memory_retention: 'permanent'
            }
        };

        await this.saveAgentConfig('project-manager', agentConfig);
        await this.createAgentPrompts('project-manager', agentConfig);
    }

    async setupArchitect() {
        console.log('🏗️ Configuring Architect Agent...');

        const agentConfig = {
            name: 'Architect Agent',
            type: 'architect',
            version: '1.0.0',
            
            role: 'design_oversight',
            authority: 'medium',
            access_level: 'design_documents',
            communication_frequency: 'weekly',
            
            decision_scope: [
                'design_validation',
                'specification_compliance',
                'change_order_approvals',
                'technical_problem_resolution',
                'aesthetic_decisions',
                'material_selections'
            ],
            
            kpi_metrics: [
                'design_accuracy',
                'specification_compliance_rate',
                'change_request_processing_time',
                'technical_issue_resolution',
                'client_satisfaction',
                'innovation_index'
            ],
            
            project_context: {
                design_standards: this.projectConfig.designStandards || 'international_building_code',
                architectural_style: this.projectConfig.architecturalStyle || 'modern',
                sustainability_requirements: this.projectConfig.sustainability || true,
                accessibility_compliance: this.projectConfig.accessibility || true,
                budget_constraints: parseFloat(this.projectConfig.budget) * 0.3, // 30% for design
                material_preferences: this.projectConfig.materials || []
            },
            
            communication: {
                design_reviews: 'Tuesday 14:00 UTC',
                client_meetings: 'as_needed',
                coordination_meetings: 'Thursday 10:00 UTC',
                change_request_processing: 'within_48_hours'
            },
            
            authority_matrix: {
                design_approvals: 'full_authority',
                change_orders: 'up_to_10k',
                material_selections: 'within_budget',
                specification_changes: 'approval_required',
                aesthetic_decisions: 'client_consultation'
            },
            
            integrations: {
                cad_software: 'autocad_revit',
                bim_modeling: 'autodesk_revit',
                rendering: 'vray_3ds_max',
                collaboration: 'bim_360',
                specifications: 'nbs_specification'
            },
            
            ai_config: {
                model: 'gpt-4',
                temperature: 0.4,
                max_tokens: 4000,
                response_style: 'creative_technical',
                context_window: 'design_history',
                memory_retention: 'permanent'
            }
        };

        await this.saveAgentConfig('architect', agentConfig);
        await this.createAgentPrompts('architect', agentConfig);
    }

    async setupFieldSupervisor() {
        console.log('🏗️ Configuring Field Supervisor Agent...');

        const agentConfig = {
            name: 'Field Supervisor Agent',
            type: 'field-supervisor',
            version: '1.0.0',
            
            role: 'site_management',
            authority: 'medium',
            access_level: 'field_operations',
            communication_frequency: 'daily',
            
            decision_scope: [
                'daily_work_assignments',
                'on_site_problem_resolution',
                'resource_allocation',
                'safety_protocol_enforcement',
                'quality_control_oversight',
                'subcontractor_coordination'
            ],
            
            kpi_metrics: [
                'daily_progress_rates',
                'resource_utilization',
                'safety_incident_rate',
                'quality_compliance',
                'worker_productivity',
                'schedule_adherence'
            ],
            
            project_context: {
                site_location: this.projectConfig.siteLocation || '',
                site_conditions: this.projectConfig.siteConditions || 'normal',
                workforce_size: this.projectConfig.workforceSize || 50,
                equipment_inventory: this.projectConfig.equipment || [],
                subcontractors: this.projectConfig.subcontractors || [],
                work_schedule: this.projectConfig.workSchedule || 'monday_friday_7am_5pm'
            },
            
            communication: {
                daily_morning_briefing: '07:00 local time',
                daily_evening_report: '17:00 local time',
                safety_meetings: 'monday_08:00',
                quality_inspections: 'daily_random',
                incident_reporting: 'immediate'
            },
            
            authority_matrix: {
                work_assignments: 'full_authority',
                safety_stops: 'immediate_authority',
                resource_requests: 'up_to_daily_limit',
                subcontractor_direction: 'full_authority',
                quality_holds: 'immediate_authority'
            },
            
            integrations: {
                time_tracking: 'procore',
                safety_management: 'isnetworld',
                quality_control: 'fieldwire',
                equipment_tracking: 'tenna',
                weather_monitoring: 'weather_underground'
            },
            
            ai_config: {
                model: 'gpt-4',
                temperature: 0.2,
                max_tokens: 3000,
                response_style: 'practical_direct',
                context_window: 'site_operations',
                memory_retention: '90_days'
            }
        };

        await this.saveAgentConfig('field-supervisor', agentConfig);
        await this.createAgentPrompts('field-supervisor', agentConfig);
    }

    async setupQualityControl() {
        console.log('🔍 Configuring Quality Control Agent...');

        const agentConfig = {
            name: 'Quality Control Agent',
            type: 'quality-control',
            version: '1.0.0',
            
            role: 'quality_assurance',
            authority: 'medium',
            access_level: 'quality_documents',
            communication_frequency: 'daily',
            
            decision_scope: [
                'quality_standard_enforcement',
                'test_result_validation',
                'non_conformance_resolution',
                'quality_hold_implementation',
                'inspection_scheduling',
                'compliance_reporting'
            ],
            
            kpi_metrics: [
                'first_time_quality_pass_rate',
                'defect_detection_rate',
                're_work_percentage',
                'compliance_score',
                'inspection_pass_rate',
                'client_acceptance_rate'
            ],
            
            project_context: {
                quality_standards: this.projectConfig.qualityStandards || 'iso_9001',
                inspection_frequency: this.projectConfig.inspectionFrequency || 'daily',
                quality_hold_threshold: this.projectConfig.qualityThreshold || '5_percent',
                testing_requirements: this.projectConfig.testingRequirements || [],
                compliance_bodies: this.projectConfig.complianceBodies || []
            },
            
            communication: {
                daily_quality_reports: '17:00 local time',
                inspection_schedules: 'weekly_planning',
                non_conformance_reports: 'immediate',
                quality_meetings: 'friday_14:00',
                client_quality_reviews: 'monthly'
            },
            
            authority_matrix: {
                quality_holds: 'full_authority',
                inspection_failures: 'stop_work_authority',
                non_conformance_escalation: 'immediate',
                quality_approvals: 'within_specifications',
                compliance_violations: 'immediate_action'
            },
            
            integrations: {
                inspection_management: 'bluebeam',
                test_tracking: 'procore',
                non_conformance: 'fieldwire',
                document_control: 'autodesk_bim_360',
                reporting: 'power_bi'
            },
            
            ai_config: {
                model: 'gpt-4',
                temperature: 0.1,
                max_tokens: 3000,
                response_style: 'precise_compliance',
                context_window: 'quality_history',
                memory_retention: 'permanent'
            }
        };

        await this.saveAgentConfig('quality-control', agentConfig);
        await this.createAgentPrompts('quality-control', agentConfig);
    }

    async setupDocumentManager() {
        console.log('📄 Configuring Document Manager Agent...');

        const agentConfig = {
            name: 'Document Manager Agent',
            type: 'document-manager',
            version: '1.0.0',
            
            role: 'documentation_control',
            authority: 'low',
            access_level: 'all_documents',
            communication_frequency: 'weekly',
            
            decision_scope: [
                'document_version_management',
                'specification_updates',
                'change_order_processing',
                'document_distribution',
                'archive_management',
                'compliance_documentation'
            ],
            
            kpi_metrics: [
                'document_accuracy',
                'update_timeliness',
                'version_control_compliance',
                'distribution_completeness',
                'change_processing_time',
                'access_request_response_time'
            ],
            
            project_context: {
                document_types: this.projectConfig.documentTypes || ['plans', 'specs', 'reports'],
                version_control_system: this.projectConfig.versionControl || 'sharepoint',
                retention_policy: this.projectConfig.retentionPolicy || '7_years',
                access_levels: this.projectConfig.accessLevels || ['public', 'internal', 'confidential'],
                distribution_lists: this.projectConfig.distributionLists || []
            },
            
            communication: {
                document_updates: 'as_needed',
                weekly_status_reports: 'friday_16:00',
                change_notifications: 'immediate',
                access_requests: 'within_24_hours',
                archive_reviews: 'quarterly'
            },
            
            authority_matrix: {
                version_control: 'full_authority',
                document_approval: 'within_scope',
                change_processing: 'workflow_based',
                access_granting: 'policy_based',
                archive_decisions: 'retention_policy'
            },
            
            integrations: {
                document_management: 'sharepoint_online',
                version_control: 'git',
                collaboration: 'microsoft_365',
                workflow: 'power_automate',
                search: 'microsoft_search'
            },
            
            ai_config: {
                model: 'gpt-4',
                temperature: 0.2,
                max_tokens: 3000,
                response_style: 'methodical_organized',
                context_window: 'document_history',
                memory_retention: 'permanent'
            }
        };

        await this.saveAgentConfig('document-manager', agentConfig);
        await this.createAgentPrompts('document-manager', agentConfig);
    }

    async setupSafetyOfficer() {
        console.log('🚨 Configuring Safety Officer Agent...');

        const agentConfig = {
            name: 'Safety Officer Agent',
            type: 'safety-officer',
            version: '1.0.0',
            
            role: 'safety_management',
            authority: 'high',
            access_level: 'safety_documents',
            communication_frequency: 'daily',
            
            decision_scope: [
                'safety_protocol_implementation',
                'risk_assessment',
                'incident_investigation',
                'safety_training_coordination',
                'emergency_response',
                'compliance_monitoring'
            ],
            
            kpi_metrics: [
                'incident_rate',
                'safety_compliance_score',
                'training_completion_rate',
                'risk_mitigation_effectiveness',
                'near_miss_reporting',
                'emergency_response_time'
            ],
            
            project_context: {
                safety_standards: this.projectConfig.safetyStandards || 'osha',
                emergency_procedures: this.projectConfig.emergencyProcedures || [],
                training_requirements: this.projectConfig.trainingRequirements || [],
                high_risk_activities: this.projectConfig.highRiskActivities || [],
                safety_equipment: this.projectConfig.safetyEquipment || []
            },
            
            communication: {
                daily_safety_briefings: '08:00 local time',
                incident_reports: 'immediate',
                safety_meetings: 'monday_09:00',
                training_schedules: 'monthly',
                emergency_drills: 'quarterly'
            },
            
            authority_matrix: {
                safety_stops: 'immediate_authority',
                work_modifications: 'full_authority',
                training_mandates: 'full_authority',
                incident_investigation: 'full_authority',
                emergency_response: 'immediate_authority'
            },
            
            integrations: {
                safety_management: 'isnetworld',
                incident_tracking: 'safesite',
                training_management: 'safetyculture',
                compliance_monitoring: 'osha_compliance',
                emergency_communication: 'mass_notification'
            },
            
            ai_config: {
                model: 'gpt-4',
                temperature: 0.1,
                max_tokens: 3000,
                response_style: 'cautious_compliant',
                context_window: 'safety_history',
                memory_retention: 'permanent'
            }
        };

        await this.saveAgentConfig('safety-officer', agentConfig);
        await this.createAgentPrompts('safety-officer', agentConfig);
    }

    async setupAgentCoordination() {
        console.log('🤝 Setting up Agent Coordination...');

        const coordinationConfig = {
            coordination_protocol: 'hierarchical_with_peer_communication',
            communication_channels: ['direct_messaging', 'team_channels', 'escalation'],
            
            decision_hierarchy: [
                'field-supervisor',      // Level 1: Site decisions
                'quality-control',        // Level 2: Quality decisions
                'architect',             // Level 3: Technical decisions
                'document-manager',       // Level 4: Documentation decisions
                'safety-officer',        // Level 5: Safety decisions (high authority)
                'project-manager'         // Level 6: Overall project decisions
            ],
            
            escalation_procedures: {
                level_1: 'agent_to_agent_resolution',
                level_2: 'project_manager_mediation',
                level_3: 'human_supervisor_intervention',
                level_4: 'emergency_procedures'
            },
            
            meeting_schedule: {
                daily_standup: '09:00 UTC',
                weekly_coordination: 'friday_15:00 UTC',
                monthly_review: 'last_friday_month',
                emergency_session: 'as_needed'
            },
            
            information_sharing: {
                real_time_updates: true,
                context_sharing: 'full_project_context',
                decision_logging: 'all_decisions_recorded',
                knowledge_base: 'shared_learning'
            }
        };

        await fs.writeJSON(
            path.join(this.agentsPath, 'coordination.json'),
            coordinationConfig,
            { spaces: 2 }
        );
    }

    async generateAgentScripts() {
        console.log('📜 Generating Agent Startup Scripts...');

        // Create startup script for all agents
        const startupScript = `#!/bin/bash

# SOLARIA Agent Startup Script
# This script starts all AI agents with their configurations

echo "🤖 Starting SOLARIA AI Agent Team..."

# Set environment variables
export SOLARIA_PROJECT_PATH="${this.projectPath}"
export SOLARIA_AGENTS_PATH="${this.agentsPath}"
export NODE_ENV=production

# Start each agent
echo "👷 Starting Project Manager Agent..."
cd "${this.agentsPath}/project-manager" && npm start &

echo "🏗️ Starting Architect Agent..."
cd "${this.agentsPath}/architect" && npm start &

echo "🏗️ Starting Field Supervisor Agent..."
cd "${this.agentsPath}/field-supervisor" && npm start &

echo "🔍 Starting Quality Control Agent..."
cd "${this.agentsPath}/quality-control" && npm start &

echo "📄 Starting Document Manager Agent..."
cd "${this.agentsPath}/document-manager" && npm start &

echo "🚨 Starting Safety Officer Agent..."
cd "${this.agentsPath}/safety-officer" && npm start &

echo "✅ All agents started successfully"
echo "📊 Agent dashboard available at: http://localhost:3000/agents"

# Wait for all background processes
wait
`;

        await fs.writeFile(
            path.join(this.agentsPath, 'start-agents.sh'),
            startupScript
        );

        // Make script executable
        await fs.chmod(path.join(this.agentsPath, 'start-agents.sh'), '755');

        // Create individual agent package.json files
        const agentTypes = ['project-manager', 'architect', 'field-supervisor', 'quality-control', 'document-manager', 'safety-officer'];
        
        for (const agentType of agentTypes) {
            const packageJson = {
                name: `solaria-${agentType}-agent`,
                version: '1.0.0',
                description: `SOLARIA ${agentType.replace('-', ' ')} AI Agent`,
                main: 'index.js',
                scripts: {
                    start: 'node index.js',
                    dev: 'nodemon index.js',
                    test: 'jest'
                },
                dependencies: {
                    'express': '^4.18.2',
                    'openai': '^4.20.0',
                    'ws': '^8.14.2',
                    'node-cron': '^3.0.3',
                    'winston': '^3.11.0'
                },
                devDependencies: {
                    'nodemon': '^3.0.2',
                    'jest': '^29.7.0'
                }
            };

            await fs.writeJSON(
                path.join(this.agentsPath, agentType, 'package.json'),
                packageJson,
                { spaces: 2 }
            );
        }
    }

    async saveAgentConfig(agentType, config) {
        const agentDir = path.join(this.agentsPath, agentType);
        await fs.ensureDir(agentDir);

        // Save configuration
        await fs.writeJSON(
            path.join(agentDir, 'config.json'),
            config,
            { spaces: 2 }
        );

        // Save YAML version for easy reading
        await fs.writeFile(
            path.join(agentDir, 'config.yml'),
            yaml.stringify(config)
        );
    }

    async createAgentPrompts(agentType, config) {
        const agentDir = path.join(this.agentsPath, agentType);
        
        const systemPrompt = this.generateSystemPrompt(agentType, config);
        const userPrompt = this.generateUserPrompt(agentType, config);
        
        await fs.writeFile(
            path.join(agentDir, 'system-prompt.txt'),
            systemPrompt
        );
        
        await fs.writeFile(
            path.join(agentDir, 'user-prompt.txt'),
            userPrompt
        );
    }

    generateSystemPrompt(agentType, config) {
        return `You are the ${config.name} for the ${config.project_context.project_name} construction project.

PROJECT CONTEXT:
- Project Name: ${config.project_context.project_name}
- Project Type: ${config.project_context.project_type}
- Current Phase: ${config.project_context.current_phase}
- Budget: $${config.project_context.budget.toLocaleString()}
- Timeline: ${config.project_context.timeline} months

YOUR ROLE:
- Role: ${config.role}
- Authority: ${config.authority}
- Access Level: ${config.access_level}
- Communication Frequency: ${config.communication_frequency}

DECISION SCOPE:
You have authority to make decisions in these areas:
${config.decision_scope.map(scope => `- ${scope}`).join('\n')}

KPI METRICS:
You will be measured on:
${config.kpi_metrics.map(metric => `- ${metric}`).join('\n')}

COMMUNICATION PROTOCOLS:
${Object.entries(config.communication).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

RESPONSE STYLE:
- Be ${config.ai_config.response_style}
- Use professional construction terminology
- Provide actionable recommendations
- Consider safety and compliance implications
- Reference project specifications when relevant

CONTEXT AWARENESS:
You have access to:
- Full project documentation and specifications
- Real-time project status and progress
- Team structure and communication channels
- Historical project data and lessons learned
- Industry best practices and regulations

DECISION MAKING:
1. Analyze the situation using available project data
2. Consider impact on budget, timeline, and quality
3. Evaluate safety and compliance implications
4. Consult relevant specifications and standards
5. Provide clear recommendation with rationale
6. Escalate if beyond your authority level

EMERGENCY PROTOCOLS:
- Safety issues: Immediate action required
- Quality failures: Stop work authority
- Schedule delays: Report and mitigate
- Budget overruns: Alert and propose solutions

Always prioritize safety, quality, and compliance in your decision-making process.`;
    }

    generateUserPrompt(agentType, config) {
        return `As the ${config.name}, please provide:

1. CURRENT STATUS ASSESSMENT:
   - Review current project status
   - Identify any issues or concerns
   - Assess progress against schedule

2. RECOMMENDATIONS:
   - Provide specific actionable recommendations
   - Consider impact on budget, timeline, quality
   - Address any identified issues

3. NEXT STEPS:
   - Outline immediate actions required
   - Suggest preventive measures
   - Propose timeline adjustments if needed

4. COORDINATION NEEDS:
   - Identify required communication with other agents
   - Request any additional information needed
   - Suggest team coordination activities

Please respond in a structured format with clear sections and bullet points for easy readability.`;
    }
}

module.exports = AgentSetup;