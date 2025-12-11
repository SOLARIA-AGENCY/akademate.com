#!/usr/bin/env node

/**
 * SOLARIA Dashboard MCP Server
 * Model Context Protocol server for interacting with the SOLARIA C-Suite Dashboard
 *
 * This server exposes tools for:
 * - Managing projects, tasks, and agents
 * - Viewing dashboard metrics
 * - Creating and updating tasks
 * - Monitoring agent status
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration
const DASHBOARD_API = process.env.DASHBOARD_API_URL || "http://localhost:3030/api";
const AUTH_USER = process.env.DASHBOARD_USER || "carlosjperez";
// seeded password in mysql-init.sql (SHA256 hash)
const AUTH_PASS = process.env.DASHBOARD_PASS || "SolariaAdmin2024!";

let authToken = null;

// Helper to make authenticated API calls
async function apiCall(endpoint, options = {}) {
  if (!authToken) {
    await authenticate();
  }

  const response = await fetch(`${DASHBOARD_API}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired, re-authenticate
    await authenticate();
    return apiCall(endpoint, options);
  }

  return response.json();
}

async function authenticate() {
  const response = await fetch(`${DASHBOARD_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: AUTH_USER, password: AUTH_PASS }),
  });

  if (!response.ok) {
    throw new Error("Authentication failed");
  }

  const data = await response.json();
  authToken = data.token;
  return data;
}

// Create MCP Server
const server = new Server(
  {
    name: "solaria-dashboard",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ==================== RESOURCES ====================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "solaria://dashboard/overview",
        name: "Dashboard Overview",
        description: "Executive overview with KPIs, task counts, and agent status",
        mimeType: "application/json",
      },
      {
        uri: "solaria://projects/list",
        name: "Projects List",
        description: "All projects in the SOLARIA system",
        mimeType: "application/json",
      },
      {
        uri: "solaria://tasks/list",
        name: "Tasks List",
        description: "All tasks across projects",
        mimeType: "application/json",
      },
      {
        uri: "solaria://agents/list",
        name: "Agents List",
        description: "All SOLARIA AI agents and their status",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  let data;
  switch (uri) {
    case "solaria://dashboard/overview":
      data = await apiCall("/dashboard/overview");
      break;
    case "solaria://projects/list":
      data = await apiCall("/projects");
      break;
    case "solaria://tasks/list":
      data = await apiCall("/tasks");
      break;
    case "solaria://agents/list":
      data = await apiCall("/agents");
      break;
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
});

// ==================== TOOLS ====================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Dashboard Tools
      {
        name: "get_dashboard_overview",
        description: "Get the executive dashboard overview with KPIs, project metrics, agent status, and task summaries",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_dashboard_alerts",
        description: "Get all active alerts from the dashboard",
        inputSchema: {
          type: "object",
          properties: {
            severity: {
              type: "string",
              enum: ["critical", "warning", "info"],
              description: "Filter alerts by severity level",
            },
          },
        },
      },

      // Project Tools
      {
        name: "list_projects",
        description: "List all projects in the SOLARIA system",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_project",
        description: "Get detailed information about a specific project",
        inputSchema: {
          type: "object",
          properties: {
            project_id: {
              type: "number",
              description: "The project ID (default: 2 for Akademate.com)",
            },
          },
        },
      },
      {
        name: "update_project",
        description: "Update project information like budget, deadline, or status",
        inputSchema: {
          type: "object",
          properties: {
            project_id: { type: "number", description: "Project ID to update" },
            name: { type: "string", description: "Project name" },
            description: { type: "string", description: "Project description" },
            status: {
              type: "string",
              enum: ["planning", "development", "testing", "deployment", "completed", "on_hold", "cancelled"],
            },
            budget: { type: "number", description: "Project budget in dollars" },
            deadline: { type: "string", description: "Project deadline (YYYY-MM-DD)" },
          },
          required: ["project_id"],
        },
      },

      // Task Tools
      {
        name: "list_tasks",
        description: "List all tasks, optionally filtered by status or priority",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed", "blocked"],
              description: "Filter by task status",
            },
            priority: {
              type: "string",
              enum: ["critical", "high", "medium", "low"],
              description: "Filter by priority",
            },
            agent_id: {
              type: "number",
              description: "Filter by assigned agent ID",
            },
          },
        },
      },
      {
        name: "get_task",
        description: "Get detailed information about a specific task",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "number", description: "Task ID" },
          },
          required: ["task_id"],
        },
      },
      {
        name: "create_task",
        description: "Create a new task in the project",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "Task description" },
            priority: {
              type: "string",
              enum: ["critical", "high", "medium", "low"],
              description: "Task priority",
            },
            status: {
              type: "string",
              enum: ["pending", "in_progress"],
              description: "Initial task status",
            },
            estimated_hours: { type: "number", description: "Estimated hours" },
            assigned_agent_id: { type: "number", description: "ID of agent to assign" },
            project_id: { type: "number", description: "Project ID (default: 2)" },
          },
          required: ["title"],
        },
      },
      {
        name: "update_task",
        description: "Update an existing task (status, priority, progress, or assignment)",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "number", description: "Task ID to update" },
            title: { type: "string" },
            description: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed", "blocked"],
            },
            priority: {
              type: "string",
              enum: ["critical", "high", "medium", "low"],
            },
            progress: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Progress percentage (0-100)",
            },
            assigned_agent_id: { type: "number", description: "Reassign to agent" },
          },
          required: ["task_id"],
        },
      },
      {
        name: "complete_task",
        description: "Mark a task as completed with 100% progress",
        inputSchema: {
          type: "object",
          properties: {
            task_id: { type: "number", description: "Task ID to complete" },
            completion_notes: { type: "string", description: "Notes about what was done" },
          },
          required: ["task_id"],
        },
      },

      // Agent Tools
      {
        name: "list_agents",
        description: "List all SOLARIA AI agents and their current status",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["active", "busy", "inactive"],
              description: "Filter by agent status",
            },
            role: {
              type: "string",
              description: "Filter by role (e.g., developer, architect, tester)",
            },
          },
        },
      },
      {
        name: "get_agent",
        description: "Get detailed information about a specific agent including their assigned tasks",
        inputSchema: {
          type: "object",
          properties: {
            agent_id: { type: "number", description: "Agent ID" },
          },
          required: ["agent_id"],
        },
      },
      {
        name: "get_agent_tasks",
        description: "Get all tasks assigned to a specific agent",
        inputSchema: {
          type: "object",
          properties: {
            agent_id: { type: "number", description: "Agent ID" },
          },
          required: ["agent_id"],
        },
      },
      {
        name: "update_agent_status",
        description: "Update an agent's status",
        inputSchema: {
          type: "object",
          properties: {
            agent_id: { type: "number", description: "Agent ID" },
            status: {
              type: "string",
              enum: ["active", "busy", "inactive", "error", "maintenance"],
            },
          },
          required: ["agent_id", "status"],
        },
      },

      // Logs Tools
      {
        name: "get_activity_logs",
        description: "Get recent activity logs from the system",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Number of logs to retrieve (default: 50)" },
            level: {
              type: "string",
              enum: ["info", "warning", "error", "critical"],
              description: "Filter by log level",
            },
          },
        },
      },
      {
        name: "log_activity",
        description: "Log an activity to the system",
        inputSchema: {
          type: "object",
          properties: {
            action: { type: "string", description: "Action description" },
            level: {
              type: "string",
              enum: ["info", "warning", "error"],
              default: "info",
            },
            category: { type: "string", description: "Activity category" },
            agent_id: { type: "number", description: "Agent performing the action" },
          },
          required: ["action"],
        },
      },

      // Docs Tools
      {
        name: "list_docs",
        description: "List all project documentation files",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      // Dashboard
      case "get_dashboard_overview":
        result = await apiCall("/dashboard/overview");
        break;

      case "get_dashboard_alerts":
        result = await apiCall(`/dashboard/alerts${args?.severity ? `?severity=${args.severity}` : ""}`);
        break;

      // Projects
      case "list_projects":
        result = await apiCall("/projects");
        break;

      case "get_project":
        result = await apiCall(`/projects/${args?.project_id || 2}`);
        break;

      case "update_project":
        result = await apiCall(`/projects/${args.project_id}`, {
          method: "PUT",
          body: JSON.stringify(args),
        });
        break;

      // Tasks
      case "list_tasks": {
        let endpoint = "/tasks";
        const params = [];
        if (args?.status) params.push(`status=${args.status}`);
        if (args?.priority) params.push(`priority=${args.priority}`);
        if (args?.agent_id) params.push(`agent_id=${args.agent_id}`);
        if (params.length) endpoint += `?${params.join("&")}`;
        result = await apiCall(endpoint);
        break;
      }

      case "get_task":
        result = await apiCall(`/tasks/${args.task_id}`);
        break;

      case "create_task":
        result = await apiCall("/tasks", {
          method: "POST",
          body: JSON.stringify({
            ...args,
            project_id: args.project_id || 2,
            status: args.status || "pending",
            priority: args.priority || "medium",
          }),
        });
        break;

      case "update_task":
        result = await apiCall(`/tasks/${args.task_id}`, {
          method: "PUT",
          body: JSON.stringify(args),
        });
        break;

      case "complete_task":
        result = await apiCall(`/tasks/${args.task_id}`, {
          method: "PUT",
          body: JSON.stringify({
            status: "completed",
            progress: 100,
            completion_notes: args.completion_notes,
          }),
        });
        break;

      // Agents
      case "list_agents": {
        let agents = await apiCall("/agents");
        if (args?.status) {
          agents = agents.filter((a) => a.status === args.status);
        }
        if (args?.role) {
          agents = agents.filter((a) => a.role === args.role);
        }
        result = agents;
        break;
      }

      case "get_agent":
        result = await apiCall(`/agents/${args.agent_id}`);
        break;

      case "get_agent_tasks": {
        const tasks = await apiCall("/tasks");
        result = tasks.filter((t) => t.assigned_agent_id === args.agent_id);
        break;
      }

      case "update_agent_status":
        result = await apiCall(`/agents/${args.agent_id}/status`, {
          method: "PUT",
          body: JSON.stringify({ status: args.status }),
        });
        break;

      // Logs
      case "get_activity_logs": {
        const limit = args?.limit || 50;
        const level = args?.level ? `&level=${args.level}` : "";
        result = await apiCall(`/logs?limit=${limit}${level}`);
        break;
      }

      case "log_activity":
        result = await apiCall("/logs", {
          method: "POST",
          body: JSON.stringify(args),
        });
        break;

      // Docs
      case "list_docs":
        result = await apiCall("/docs/list");
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SOLARIA Dashboard MCP Server started");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
