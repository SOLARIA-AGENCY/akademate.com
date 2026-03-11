# @akademate/mcp-server

MCP (Model Context Protocol) Server for Akademate. Connects Claude Desktop, Cursor, Continue.dev and any other MCP-compatible client to your academy so you can manage courses, students, and enrollments with natural language.

## Requirements

- Node.js >= 18
- An Akademate API Key with the required scopes

## Getting an API Key

1. Log in to your Akademate dashboard
2. Navigate to **Configuracion > APIs** (`/configuracion/apis`)
3. Click **Nueva API Key**
4. Select the scopes you need:
   - `courses:read` — list and view courses
   - `courses:write` — create and update courses
   - `students:read` — list and view students
   - `students:write` — create students
   - `enrollments:read` — list enrollments
   - `enrollments:write` — create enrollments
   - `analytics:read` — view dashboard KPIs
5. Copy the key shown **exactly once** — it cannot be shown again

## Available Tools

| Tool | Required Scope | Description |
|------|---------------|-------------|
| `get_courses` | `courses:read` | List courses (paginated, optional text search) |
| `get_course` | `courses:read` | Get full detail of a single course |
| `get_students` | `students:read` | List students (paginated) |
| `get_analytics` | `analytics:read` | Dashboard KPIs: students, courses, enrollments, completion rate |
| `create_enrollment` | `enrollments:write` | Enroll a student in a course run |
| `get_schedule` | `courses:read` | List upcoming course runs / convocatorias |

## Available Resources

| URI | Description |
|-----|-------------|
| `akademate://courses` | Full course catalog (first 100) |
| `akademate://students` | Full student list (first 100) |

## Configuration

The server reads two environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `AKADEMATE_API_URL` | `http://localhost:3000` | Base URL of your Akademate instance |
| `AKADEMATE_API_KEY` | _(none)_ | API key from /configuracion/apis |

## Claude Desktop

Add the following to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "akademate": {
      "command": "npx",
      "args": ["-y", "@akademate/mcp-server"],
      "env": {
        "AKADEMATE_API_URL": "https://app.akademate.com",
        "AKADEMATE_API_KEY": "ak_live_your_key_here"
      }
    }
  }
}
```

If you have cloned the repository locally, you can also point directly to the built file:

```json
{
  "mcpServers": {
    "akademate": {
      "command": "node",
      "args": ["/path/to/akademate.com/packages/mcp-server/dist/index.js"],
      "env": {
        "AKADEMATE_API_URL": "https://app.akademate.com",
        "AKADEMATE_API_KEY": "ak_live_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop after saving the config. You should see an "akademate" entry in the MCP tools panel.

## Cursor

Open **Settings > MCP** and add a new server entry:

```json
{
  "name": "akademate",
  "command": "npx -y @akademate/mcp-server",
  "env": {
    "AKADEMATE_API_URL": "https://app.akademate.com",
    "AKADEMATE_API_KEY": "ak_live_your_key_here"
  }
}
```

## Continue.dev

In your `~/.continue/config.json`, add under `mcpServers`:

```json
{
  "mcpServers": [
    {
      "name": "akademate",
      "command": "npx",
      "args": ["-y", "@akademate/mcp-server"],
      "env": {
        "AKADEMATE_API_URL": "https://app.akademate.com",
        "AKADEMATE_API_KEY": "ak_live_your_key_here"
      }
    }
  ]
}
```

## Example prompts

Once connected, you can ask your AI assistant:

- "Muéstrame los cursos activos de la academia"
- "Cuantos alumnos hay matriculados actualmente?"
- "Crea una matricula para el alumno con id stu_abc123 en la convocatoria run_xyz789"
- "Dame el resumen de analíticas del dashboard"
- "Busca el curso de Administración de Sistemas Informáticos"
- "Matricula a Juan García en el próximo ciclo de DAW"

## Local development

```bash
# Install dependencies
pnpm install

# Run in dev mode (no build required)
AKADEMATE_API_URL=http://localhost:3000 AKADEMATE_API_KEY=ak_live_xxx pnpm dev

# Build for production
pnpm build

# Run built version
AKADEMATE_API_URL=https://app.akademate.com AKADEMATE_API_KEY=ak_live_xxx pnpm start
```

## Security notes

- API keys are tenant-scoped: the server can only access data from the tenant that issued the key
- Keys are validated on every request — revoke a key from the dashboard to immediately cut off access
- The server does not cache responses or store data locally
- Use read-only scopes (`courses:read`, `students:read`, etc.) when write access is not needed
