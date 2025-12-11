#!/usr/bin/env node

/**
 * SOLARIA Project Analyzer
 * 
 * Analyzes construction project repositories to extract:
 * - Project specifications
 * - Construction documents
 * - Team structure
 * - Timeline and budget
 * - Technical requirements
 */

const fs = require('fs-extra');
const path = require('path');
const pdf = require('pdf-parse');
const cheerio = require('cheerio');
const yaml = require('yaml');

class ProjectAnalyzer {
    constructor() {
        this.analysis = {
            projectInfo: {},
            documents: [],
            specifications: {},
            team: {},
            timeline: {},
            budget: {},
            risks: [],
            requirements: []
        };
    }

    async analyzeRepository(repoPath) {
        console.log('🔍 Analyzing construction project repository...');

        try {
            // Scan repository structure
            await this.scanStructure(repoPath);

            // Extract project information
            await this.extractProjectInfo(repoPath);

            // Process construction documents
            await this.processDocuments(repoPath);

            // Extract specifications
            await this.extractSpecifications(repoPath);

            // Analyze team structure
            await this.analyzeTeam(repoPath);

            // Extract timeline and budget
            await this.extractProjectPlan(repoPath);

            // Identify risks and requirements
            await this.identifyRisksAndRequirements(repoPath);

            return this.analysis;

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            throw error;
        }
    }

    async scanStructure(repoPath) {
        console.log('📁 Scanning repository structure...');

        const structure = {
            directories: [],
            files: [],
            fileTypes: {},
            hasReadme: false,
            hasSpecs: false,
            hasPlans: false,
            hasDocuments: false
        };

        const scanDir = async (dir, relativePath = '') => {
            const items = await fs.readdir(dir);

            for (const item of items) {
                const itemPath = path.join(dir, item);
                const relativeItemPath = path.join(relativePath, item);
                const stats = await fs.stat(itemPath);

                if (stats.isDirectory()) {
                    structure.directories.push(relativeItemPath);
                    await scanDir(itemPath, relativeItemPath);
                } else {
                    const ext = path.extname(item).toLowerCase();
                    structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
                    structure.files.push({
                        name: item,
                        path: relativeItemPath,
                        fullPath: itemPath,
                        size: stats.size,
                        modified: stats.mtime,
                        type: this.getFileType(ext)
                    });

                    if (item.toLowerCase().includes('readme')) structure.hasReadme = true;
                    if (item.toLowerCase().includes('spec')) structure.hasSpecs = true;
                    if (item.toLowerCase().includes('plan')) structure.hasPlans = true;
                    if (this.isDocumentFile(ext)) structure.hasDocuments = true;
                }
            }
        };

        await scanDir(repoPath);
        this.analysis.structure = structure;

        console.log(`✅ Found ${structure.files.length} files in ${structure.directories.length} directories`);
    }

    async extractProjectInfo(repoPath) {
        console.log('📋 Extracting project information...');

        const projectInfo = {
            name: '',
            type: '',
            description: '',
            location: '',
            client: '',
            architect: '',
            contractor: '',
            startDate: null,
            endDate: null,
            status: 'planning'
        };

        // Try to extract from README
        const readmePath = this.findFile(repoPath, ['README.md', 'readme.md', 'README.txt']);
        if (readmePath) {
            const content = await fs.readFile(readmePath, 'utf-8');
            Object.assign(projectInfo, this.extractFromReadme(content));
        }

        // Try to extract from package.json or similar
        const packagePath = this.findFile(repoPath, ['package.json', 'project.json']);
        if (packagePath) {
            const content = await fs.readJSON(packagePath);
            Object.assign(projectInfo, this.extractFromPackageJson(content));
        }

        // Try to extract from YAML files
        const yamlPath = this.findFile(repoPath, ['project.yml', 'project.yaml', 'config.yml']);
        if (yamlPath) {
            const content = await fs.readFile(yamlPath, 'utf-8');
            Object.assign(projectInfo, this.extractFromYaml(content));
        }

        this.analysis.projectInfo = projectInfo;
    }

    async processDocuments(repoPath) {
        console.log('📄 Processing construction documents...');

        const documents = [];
        const documentFiles = this.analysis.structure.files.filter(file => 
            file.type === 'document' || file.type === 'drawing'
        );

        for (const file of documentFiles) {
            try {
                const content = await this.extractDocumentContent(file.fullPath);
                const metadata = await this.extractDocumentMetadata(file.fullPath);

                documents.push({
                    ...file,
                    content: content,
                    metadata: metadata,
                    category: this.categorizeDocument(file.name, content),
                    importance: this.calculateImportance(file.name, content)
                });
            } catch (error) {
                console.warn(`⚠️  Could not process ${file.name}: ${error.message}`);
            }
        }

        // Sort by importance
        documents.sort((a, b) => b.importance - a.importance);
        this.analysis.documents = documents;

        console.log(`✅ Processed ${documents.length} construction documents`);
    }

    async extractSpecifications(repoPath) {
        console.log('📐 Extracting project specifications...');

        const specs = {
            general: [],
            technical: [],
            architectural: [],
            structural: [],
            mechanical: [],
            electrical: [],
            plumbing: [],
            safety: [],
            environmental: [],
            quality: []
        };

        // Look for specification files
        const specFiles = this.analysis.structure.files.filter(file =>
            file.name.toLowerCase().includes('spec') ||
            file.name.toLowerCase().includes('requirement') ||
            file.name.toLowerCase().includes('standard')
        );

        for (const file of specFiles) {
            try {
                const content = await this.extractDocumentContent(file.fullPath);
                const category = this.categorizeSpecification(file.name, content);
                
                specs[category].push({
                    filename: file.name,
                    path: file.path,
                    content: content,
                    requirements: this.extractRequirements(content),
                    version: this.extractVersion(content),
                    date: this.extractDate(content)
                });
            } catch (error) {
                console.warn(`⚠️  Could not extract specs from ${file.name}: ${error.message}`);
            }
        }

        this.analysis.specifications = specs;
        console.log(`✅ Extracted specifications from ${specFiles.length} files`);
    }

    async analyzeTeam(repoPath) {
        console.log('👥 Analyzing team structure...');

        const team = {
            projectManager: null,
            architect: null,
            engineer: null,
            contractor: null,
            subcontractors: [],
            consultants: [],
            totalMembers: 0
        };

        // Look for team information in documents
        const teamFiles = this.analysis.structure.files.filter(file =>
            file.name.toLowerCase().includes('team') ||
            file.name.toLowerCase().includes('contact') ||
            file.name.toLowerCase().includes('staff')
        );

        for (const file of teamFiles) {
            try {
                const content = await this.extractDocumentContent(file.fullPath);
                const teamInfo = this.extractTeamInfo(content);
                Object.assign(team, teamInfo);
            } catch (error) {
                console.warn(`⚠️  Could not analyze team from ${file.name}: ${error.message}`);
            }
        }

        this.analysis.team = team;
    }

    async extractProjectPlan(repoPath) {
        console.log('📅 Extracting project timeline and budget...');

        const timeline = {
            phases: [],
            milestones: [],
            startDate: null,
            endDate: null,
            duration: null,
            currentPhase: 'planning'
        };

        const budget = {
            total: 0,
            allocated: 0,
            spent: 0,
            remaining: 0,
            categories: {},
            currency: 'USD'
        };

        // Look for plan and budget files
        const planFiles = this.analysis.structure.files.filter(file =>
            file.name.toLowerCase().includes('schedule') ||
            file.name.toLowerCase().includes('timeline') ||
            file.name.toLowerCase().includes('plan') ||
            file.name.toLowerCase().includes('budget') ||
            file.name.toLowerCase().includes('cost')
        );

        for (const file of planFiles) {
            try {
                const content = await this.extractDocumentContent(file.fullPath);
                
                if (file.name.toLowerCase().includes('budget') || file.name.toLowerCase().includes('cost')) {
                    Object.assign(budget, this.extractBudgetInfo(content));
                } else {
                    Object.assign(timeline, this.extractTimelineInfo(content));
                }
            } catch (error) {
                console.warn(`⚠️  Could not extract plan from ${file.name}: ${error.message}`);
            }
        }

        this.analysis.timeline = timeline;
        this.analysis.budget = budget;
    }

    async identifyRisksAndRequirements(repoPath) {
        console.log('⚠️  Identifying risks and requirements...');

        const risks = [];
        const requirements = [];

        // Analyze all documents for risk indicators
        for (const doc of this.analysis.documents) {
            const docRisks = this.identifyRisks(doc.content);
            const docRequirements = this.identifyRequirements(doc.content);

            risks.push(...docRisks.map(risk => ({
                ...risk,
                source: doc.name,
                category: this.categorizeRisk(risk.description)
            })));

            requirements.push(...docRequirements.map(req => ({
                ...req,
                source: doc.name,
                category: this.categorizeRequirement(req.description)
            })));
        }

        // Remove duplicates and sort
        this.analysis.risks = this.deduplicateAndSort(risks, 'description');
        this.analysis.requirements = this.deduplicateAndSort(requirements, 'description');

        console.log(`✅ Identified ${risks.length} risks and ${requirements.length} requirements`);
    }

    // Helper methods
    getFileType(ext) {
        const types = {
            '.pdf': 'document',
            '.doc': 'document',
            '.docx': 'document',
            '.dwg': 'drawing',
            '.dxf': 'drawing',
            '.xlsx': 'spreadsheet',
            '.csv': 'data',
            '.jpg': 'image',
            '.jpeg': 'image',
            '.png': 'image',
            '.txt': 'text',
            '.md': 'text'
        };
        return types[ext] || 'unknown';
    }

    isDocumentFile(ext) {
        return ['.pdf', '.doc', '.docx', '.dwg', '.dxf', '.xlsx', '.csv'].includes(ext);
    }

    findFile(dir, filenames) {
        for (const filename of filenames) {
            const filePath = path.join(dir, filename);
            if (fs.existsSync(filePath)) {
                return filePath;
            }
        }
        return null;
    }

    async extractDocumentContent(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        if (ext === '.pdf') {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        } else if (['.doc', '.docx', '.txt', '.md'].includes(ext)) {
            return await fs.readFile(filePath, 'utf-8');
        } else if (['.xlsx', '.csv'].includes(ext)) {
            // For spreadsheets, return a summary
            return `Spreadsheet file: ${path.basename(filePath)}`;
        } else {
            return `Binary file: ${path.basename(filePath)}`;
        }
    }

    async extractDocumentMetadata(filePath) {
        const stats = await fs.stat(filePath);
        return {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: path.extname(filePath),
            name: path.basename(filePath, path.extname(filePath))
        };
    }

    categorizeDocument(filename, content) {
        const name = filename.toLowerCase();
        const contentLower = content.toLowerCase();

        if (name.includes('architect') || contentLower.includes('architect')) return 'architectural';
        if (name.includes('structural') || contentLower.includes('structural')) return 'structural';
        if (name.includes('mechanical') || contentLower.includes('mechanical')) return 'mechanical';
        if (name.includes('electrical') || contentLower.includes('electrical')) return 'electrical';
        if (name.includes('plumbing') || contentLower.includes('plumbing')) return 'plumbing';
        if (name.includes('safety') || contentLower.includes('safety')) return 'safety';
        if (name.includes('spec') || contentLower.includes('specification')) return 'specification';
        if (name.includes('plan') || contentLower.includes('plan')) return 'plan';
        if (name.includes('drawing') || contentLower.includes('drawing')) return 'drawing';
        
        return 'general';
    }

    calculateImportance(filename, content) {
        let score = 1;

        const name = filename.toLowerCase();
        const contentLower = content.toLowerCase();

        // High importance indicators
        if (name.includes('spec')) score += 3;
        if (name.includes('requirement')) score += 3;
        if (name.includes('safety')) score += 3;
        if (name.includes('structural')) score += 2;

        // Medium importance indicators
        if (name.includes('plan')) score += 2;
        if (name.includes('architect')) score += 2;
        if (name.includes('mechanical')) score += 1;
        if (name.includes('electrical')) score += 1;

        // Content-based scoring
        if (contentLower.includes('critical')) score += 2;
        if (contentLower.includes('important')) score += 1;
        if (contentLower.includes('requirement')) score += 1;

        return score;
    }

    categorizeSpecification(filename, content) {
        const name = filename.toLowerCase();
        const contentLower = content.toLowerCase();

        if (name.includes('architect') || contentLower.includes('architect')) return 'architectural';
        if (name.includes('structural') || contentLower.includes('structural')) return 'structural';
        if (name.includes('mechanical') || contentLower.includes('mechanical')) return 'mechanical';
        if (name.includes('electrical') || contentLower.includes('electrical')) return 'electrical';
        if (name.includes('plumbing') || contentLower.includes('plumbing')) return 'plumbing';
        if (name.includes('safety') || contentLower.includes('safety')) return 'safety';
        if (name.includes('environmental') || contentLower.includes('environmental')) return 'environmental';
        if (name.includes('quality') || contentLower.includes('quality')) return 'quality';
        
        return 'general';
    }

    extractRequirements(content) {
        const requirements = [];
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            
            // Look for requirement patterns
            if (trimmed.match(/^(requirement|req|shall|must|will)/i)) {
                requirements.push({
                    description: trimmed,
                    type: 'requirement',
                    priority: this.determinePriority(trimmed)
                });
            }
        }

        return requirements;
    }

    extractVersion(content) {
        const versionMatch = content.match(/version\s*:?\s*([0-9.]+)/i);
        return versionMatch ? versionMatch[1] : '1.0';
    }

    extractDate(content) {
        const dateMatch = content.match(/date\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i);
        return dateMatch ? new Date(dateMatch[1]) : new Date();
    }

    extractFromReadme(content) {
        const info = {};
        
        // Extract project name
        const nameMatch = content.match(/^#\s+(.+)$/m);
        if (nameMatch) info.name = nameMatch[1].trim();

        // Extract description
        const descMatch = content.match(/^(.+)$/m);
        if (descMatch && descMatch[1] !== info.name) {
            info.description = descMatch[1].trim();
        }

        return info;
    }

    extractFromPackageJson(content) {
        return {
            name: content.name || content.projectName,
            description: content.description,
            type: content.type || content.projectType
        };
    }

    extractFromYaml(content) {
        try {
            return yaml.parse(content);
        } catch (error) {
            return {};
        }
    }

    extractTeamInfo(content) {
        const team = {};
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.toLowerCase().includes('project manager')) {
                team.projectManager = this.extractName(trimmed);
            } else if (trimmed.toLowerCase().includes('architect')) {
                team.architect = this.extractName(trimmed);
            } else if (trimmed.toLowerCase().includes('engineer')) {
                team.engineer = this.extractName(trimmed);
            } else if (trimmed.toLowerCase().includes('contractor')) {
                team.contractor = this.extractName(trimmed);
            }
        }

        return team;
    }

    extractName(text) {
        const nameMatch = text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
        return nameMatch ? nameMatch[1] : text;
    }

    extractBudgetInfo(content) {
        const budget = {
            total: 0,
            categories: {}
        };

        // Look for monetary values
        const amountMatch = content.match(/\$[\d,]+\.?\d*/g);
        if (amountMatch) {
            budget.total = parseFloat(amountMatch[0].replace(/[$,]/g, ''));
        }

        return budget;
    }

    extractTimelineInfo(content) {
        const timeline = {
            phases: [],
            milestones: []
        };

        // Look for dates and phases
        const dateMatches = content.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g);
        if (dateMatches) {
            timeline.startDate = new Date(dateMatches[0]);
            if (dateMatches.length > 1) {
                timeline.endDate = new Date(dateMatches[dateMatches.length - 1]);
            }
        }

        return timeline;
    }

    identifyRisks(content) {
        const risks = [];
        const riskKeywords = [
            'risk', 'danger', 'hazard', 'unsafe', 'failure',
            'delay', 'overrun', 'shortage', 'defect', 'error'
        ];

        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            
            for (const keyword of riskKeywords) {
                if (line.includes(keyword)) {
                    risks.push({
                        description: lines[i].trim(),
                        severity: this.assessRiskSeverity(lines[i]),
                        probability: this.assessRiskProbability(lines[i]),
                        mitigation: this.suggestMitigation(lines[i])
                    });
                    break;
                }
            }
        }

        return risks;
    }

    identifyRequirements(content) {
        const requirements = [];
        const requirementPatterns = [
            /shall\s+/i,
            /must\s+/i,
            /will\s+/i,
            /requirement\s*[:\-]/i,
            /spec\s*[:\-]/i
        ];

        const lines = content.split('\n');
        for (const line of lines) {
            for (const pattern of requirementPatterns) {
                if (line.match(pattern)) {
                    requirements.push({
                        description: line.trim(),
                        type: 'functional',
                        priority: this.determinePriority(line)
                    });
                    break;
                }
            }
        }

        return requirements;
    }

    categorizeRisk(description) {
        const desc = description.toLowerCase();
        
        if (desc.includes('safety') || desc.includes('hazard')) return 'safety';
        if (desc.includes('budget') || desc.includes('cost')) return 'financial';
        if (desc.includes('schedule') || desc.includes('delay')) return 'schedule';
        if (desc.includes('technical') || desc.includes('failure')) return 'technical';
        if (desc.includes('quality') || desc.includes('defect')) return 'quality';
        
        return 'general';
    }

    categorizeRequirement(description) {
        const desc = description.toLowerCase();
        
        if (desc.includes('safety')) return 'safety';
        if (desc.includes('structural')) return 'structural';
        if (desc.includes('electrical')) return 'electrical';
        if (desc.includes('mechanical')) return 'mechanical';
        if (desc.includes('plumbing')) return 'plumbing';
        if (desc.includes('accessibility')) return 'accessibility';
        if (desc.includes('environmental')) return 'environmental';
        
        return 'general';
    }

    assessRiskSeverity(text) {
        if (text.toLowerCase().includes('critical') || text.toLowerCase().includes('severe')) return 'high';
        if (text.toLowerCase().includes('moderate')) return 'medium';
        return 'low';
    }

    assessRiskProbability(text) {
        if (text.toLowerCase().includes('likely') || text.toLowerCase().includes('probable')) return 'high';
        if (text.toLowerCase().includes('possible') || text.toLowerCase().includes('may')) return 'medium';
        return 'low';
    }

    suggestMitigation(riskText) {
        const text = riskText.toLowerCase();
        
        if (text.includes('safety')) return 'Implement safety protocols and training';
        if (text.includes('budget')) return 'Regular budget monitoring and controls';
        if (text.includes('schedule')) return 'Buffer time and critical path monitoring';
        if (text.includes('quality')) return 'Quality assurance processes and inspections';
        
        return 'Regular monitoring and assessment';
    }

    determinePriority(text) {
        if (text.toLowerCase().includes('critical') || text.toLowerCase().includes('urgent')) return 'high';
        if (text.toLowerCase().includes('important')) return 'medium';
        return 'low';
    }

    deduplicateAndSort(items, key) {
        const unique = items.filter((item, index, self) =>
            index === self.findIndex(i => i[key] === item[key])
        );
        
        return unique.sort((a, b) => {
            if (a.priority && b.priority) {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return 0;
        });
    }
}

module.exports = ProjectAnalyzer;