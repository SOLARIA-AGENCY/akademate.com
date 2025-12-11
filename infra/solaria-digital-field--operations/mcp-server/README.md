# SOLARIA Dashboard MCP Server

Model Context Protocol (MCP) server for interacting with the SOLARIA C-Suite Dashboard.

## Overview

This MCP server allows AI agents (like Claude) to interact directly with the SOLARIA Digital Field Operations dashboard. It provides tools for:

- **Project Management**: List, view, and update projects
- **Task Management**: Create, update, complete, and list tasks
- **Agent Monitoring**: View SOLARIA AI agent status and assignments
- **Dashboard Metrics**: Get executive overview and KPIs
- **Activity Logs**: Read and write system activity logs
- **Documentation**: List project documentation

## Installation

### For Local Development

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Configure environment variables (defaults already set for Akademate):
```bash
export DASHBOARD_API_URL=http://localhost:3030/api
export DASHBOARD_USER=carlosjperez
export DASHBOARD_PASS=SolariaAdmin2024!
```

3. Run the server:
```bash
npm start
```

### For Claude Code

Add to your `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "solaria-dashboard": {
      "command": "pnpm",
      "args": ["-C", "/Users/carlosjperez/Documents/GitHub/akademate.com", "mcp:dfo"]
    }
  }
}
```

### With Docker

The MCP server is included in the docker-compose setup:

```bash
docker-compose up -d
```

To use it from outside Docker, configure your MCP client to connect via docker exec:

```json
{
  "mcpServers": {
    "solaria-dashboard": {
      "command": "docker",
      "args": ["exec", "-i", "solaria-digital-field--operations-mcp-server-1", "node", "server.js"]
    }
  }
}
```

## Available Tools

### Dashboard Tools

| Tool | Description |
|------|-------------|
| `get_dashboard_overview` | Get executive KPIs and metrics |
| `get_dashboard_alerts` | Get active system alerts |

### Project Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects |
| `get_project` | Get project details |
| `update_project` | Update project info (budget, status, etc.) |

### Task Tools

| Tool | Description |
|------|-------------|
| `list_tasks` | List tasks (with optional filters) |
| `get_task` | Get task details |
| `create_task` | Create a new task |
| `update_task` | Update task status/priority/progress |
| `complete_task` | Mark task as completed |

### Agent Tools

| Tool | Description |
|------|-------------|
| `list_agents` | List all SOLARIA agents |
| `get_agent` | Get agent details |
| `get_agent_tasks` | Get tasks assigned to an agent |
| `update_agent_status` | Update agent status |

### Logs Tools

| Tool | Description |
|------|-------------|
| `get_activity_logs` | Get recent activity logs |
| `log_activity` | Log a new activity |

### Documentation Tools

| Tool | Description |
|------|-------------|
| `list_docs` | List project documentation |

## Available Resources

The server also exposes resources that can be read directly:

- `solaria://dashboard/overview` - Dashboard overview data
- `solaria://projects/list` - All projects
- `solaria://tasks/list` - All tasks
- `solaria://agents/list` - All agents

## Example Usage

Once configured in Claude Code or Claude Desktop, you can use natural language:

```
"Show me the current task status for the Akademate project"
"Create a new task: Implement user authentication with high priority"
"Mark task #5 as completed with notes about what was done"
"List all tasks assigned to SOLARIA-DEV-01"
"What's the current progress on the project?"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHBOARD_API_URL` | Dashboard API base URL | `http://localhost:3030/api` |
| `DASHBOARD_USER` | Authentication username | `carlosjperez` |
| `DASHBOARD_PASS` | Authentication password | `bypass` |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Code    │────▶│   MCP Server    │────▶│ Dashboard API   │
│  (MCP Client)   │     │  (stdio)        │     │ (HTTP/JSON)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  MySQL Database │
                                                └─────────────────┘
```

## Security Notes

- The MCP server authenticates with the Dashboard API using JWT tokens
- Tokens are automatically refreshed when expired
- For production, ensure secure credentials are used
- The server runs locally and communicates via stdio (no network exposure)

## License

MIT - SOLARIA Agency
