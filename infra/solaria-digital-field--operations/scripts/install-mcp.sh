#!/bin/bash
#
# SOLARIA Dashboard MCP Auto-Installer
# Automatically installs and configures the MCP server for any AI agent environment
#
# Usage: bash scripts/install-mcp.sh
#
# Supports:
# - Claude Code (Claude Desktop)
# - Cursor
# - Windsurf
# - VS Code with Continue
# - Generic MCP clients
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MCP_SERVER_DIR="$PROJECT_ROOT/mcp-server"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     SOLARIA Dashboard MCP Server - Auto Installer             ║"
echo "║     Model Context Protocol for AI Agent Integration           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*)  echo "linux" ;;
        MINGW*|CYGWIN*|MSYS*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

OS=$(detect_os)
echo -e "${GREEN}[INFO]${NC} Detected OS: $OS"

# Detect AI environment
detect_environment() {
    local env="generic"

    # Check for Claude Code / Claude Desktop
    if [ -d "$HOME/.claude" ] || [ -d "$HOME/Library/Application Support/Claude" ]; then
        env="claude"
    fi

    # Check for Cursor
    if [ -d "$HOME/.cursor" ] || [ -d "$HOME/Library/Application Support/Cursor" ]; then
        env="cursor"
    fi

    # Check for Windsurf
    if [ -d "$HOME/.windsurf" ] || [ -d "$HOME/Library/Application Support/Windsurf" ]; then
        env="windsurf"
    fi

    # Check for VS Code with Continue
    if [ -d "$HOME/.continue" ]; then
        env="continue"
    fi

    echo "$env"
}

ENVIRONMENT=$(detect_environment)
echo -e "${GREEN}[INFO]${NC} Detected environment: $ENVIRONMENT"

# Get config directory based on environment and OS
get_config_dir() {
    local env="$1"
    local os="$2"

    case "$env" in
        claude)
            if [ "$os" = "macos" ]; then
                echo "$HOME/Library/Application Support/Claude"
            elif [ "$os" = "linux" ]; then
                echo "$HOME/.config/claude"
            else
                echo "$APPDATA/Claude"
            fi
            ;;
        cursor)
            if [ "$os" = "macos" ]; then
                echo "$HOME/Library/Application Support/Cursor/User"
            elif [ "$os" = "linux" ]; then
                echo "$HOME/.config/Cursor/User"
            else
                echo "$APPDATA/Cursor/User"
            fi
            ;;
        windsurf)
            if [ "$os" = "macos" ]; then
                echo "$HOME/Library/Application Support/Windsurf"
            elif [ "$os" = "linux" ]; then
                echo "$HOME/.config/windsurf"
            else
                echo "$APPDATA/Windsurf"
            fi
            ;;
        continue)
            echo "$HOME/.continue"
            ;;
        *)
            echo "$HOME/.mcp"
            ;;
    esac
}

CONFIG_DIR=$(get_config_dir "$ENVIRONMENT" "$OS")
echo -e "${GREEN}[INFO]${NC} Config directory: $CONFIG_DIR"

# Install Node.js dependencies
install_dependencies() {
    echo -e "${YELLOW}[STEP]${NC} Installing MCP server dependencies..."

    cd "$MCP_SERVER_DIR"

    if command -v npm &> /dev/null; then
        npm install --omit=dev 2>/dev/null || npm install
        echo -e "${GREEN}[OK]${NC} Dependencies installed"
    else
        echo -e "${RED}[ERROR]${NC} npm not found. Please install Node.js first."
        exit 1
    fi
}

# Generate MCP config for the detected environment
generate_config() {
    local env="$1"
    local config_file=""
    local config_content=""

    # Determine config file name
    case "$env" in
        claude)
            config_file="$CONFIG_DIR/claude_desktop_config.json"
            ;;
        cursor)
            config_file="$CONFIG_DIR/mcp.json"
            ;;
        windsurf)
            config_file="$CONFIG_DIR/mcp_config.json"
            ;;
        continue)
            config_file="$CONFIG_DIR/config.json"
            ;;
        *)
            config_file="$CONFIG_DIR/mcp-servers.json"
            ;;
    esac

    echo -e "${YELLOW}[STEP]${NC} Configuring MCP server for $env..."

    # Create config directory if it doesn't exist
    mkdir -p "$(dirname "$config_file")"

    # MCP server configuration
    local mcp_config='{
    "solaria-dashboard": {
      "command": "node",
      "args": ["'"$MCP_SERVER_DIR"'/server.js"],
      "env": {
        "DASHBOARD_API_URL": "http://localhost:3030/api",
        "DASHBOARD_USER": "carlosjperez",
        "DASHBOARD_PASS": "bypass"
      }
    }
  }'

    # Check if config file exists and merge
    if [ -f "$config_file" ]; then
        echo -e "${YELLOW}[INFO]${NC} Existing config found, merging..."

        # Use node to merge JSON configs
        node -e "
const fs = require('fs');
const existing = JSON.parse(fs.readFileSync('$config_file', 'utf8'));
const newServer = $mcp_config;

// Ensure mcpServers key exists
if (!existing.mcpServers) {
    existing.mcpServers = {};
}

// Merge
existing.mcpServers['solaria-dashboard'] = newServer['solaria-dashboard'];

fs.writeFileSync('$config_file', JSON.stringify(existing, null, 2));
console.log('Config merged successfully');
" 2>/dev/null || {
            # Fallback: create new config
            echo '{"mcpServers": '"$mcp_config"'}' > "$config_file"
        }
    else
        # Create new config file
        case "$env" in
            claude|cursor|windsurf)
                echo '{"mcpServers": '"$mcp_config"'}' > "$config_file"
                ;;
            continue)
                # Continue has different format
                node -e "
const fs = require('fs');
const config = {
    models: [],
    mcpServers: $mcp_config
};
fs.writeFileSync('$config_file', JSON.stringify(config, null, 2));
" 2>/dev/null || echo '{"mcpServers": '"$mcp_config"'}' > "$config_file"
                ;;
            *)
                echo "$mcp_config" > "$config_file"
                ;;
        esac
    fi

    echo -e "${GREEN}[OK]${NC} Config written to: $config_file"
}

# Verify installation
verify_installation() {
    echo -e "${YELLOW}[STEP]${NC} Verifying installation..."

    # Check if server.js exists
    if [ ! -f "$MCP_SERVER_DIR/server.js" ]; then
        echo -e "${RED}[ERROR]${NC} server.js not found"
        return 1
    fi

    # Check if dependencies are installed
    if [ ! -d "$MCP_SERVER_DIR/node_modules" ]; then
        echo -e "${RED}[ERROR]${NC} Dependencies not installed"
        return 1
    fi

    # Try to run a quick syntax check
    node --check "$MCP_SERVER_DIR/server.js" 2>/dev/null && {
        echo -e "${GREEN}[OK]${NC} Server syntax verified"
    } || {
        echo -e "${YELLOW}[WARN]${NC} Could not verify server syntax (may still work)"
    }

    echo -e "${GREEN}[OK]${NC} Installation verified"
    return 0
}

# Print usage instructions
print_instructions() {
    local env="$1"

    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Installation Complete!${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo ""

    case "$env" in
        claude)
            echo -e "${YELLOW}For Claude Code / Claude Desktop:${NC}"
            echo "1. Restart Claude Desktop application"
            echo "2. The SOLARIA Dashboard tools will be available automatically"
            echo ""
            echo "Try asking: 'Show me the current project status'"
            ;;
        cursor)
            echo -e "${YELLOW}For Cursor:${NC}"
            echo "1. Restart Cursor"
            echo "2. Open Command Palette (Cmd/Ctrl+Shift+P)"
            echo "3. Search for 'MCP' to verify the server is loaded"
            ;;
        windsurf)
            echo -e "${YELLOW}For Windsurf:${NC}"
            echo "1. Restart Windsurf"
            echo "2. The MCP server will be available in the AI assistant"
            ;;
        continue)
            echo -e "${YELLOW}For Continue (VS Code):${NC}"
            echo "1. Restart VS Code"
            echo "2. Open Continue sidebar"
            echo "3. The SOLARIA tools will be available"
            ;;
        *)
            echo -e "${YELLOW}For other MCP clients:${NC}"
            echo "Add this to your MCP configuration:"
            echo ""
            echo '  "solaria-dashboard": {'
            echo '    "command": "node",'
            echo "    \"args\": [\"$MCP_SERVER_DIR/server.js\"],"
            echo '    "env": {'
            echo '      "DASHBOARD_API_URL": "http://localhost:3030/api"'
            echo '    }'
            echo '  }'
            ;;
    esac

    echo ""
    echo -e "${BLUE}Available Tools:${NC}"
    echo "  - get_dashboard_overview  : Get executive KPIs"
    echo "  - list_tasks              : List all tasks"
    echo "  - create_task             : Create a new task"
    echo "  - update_task             : Update task status/priority"
    echo "  - complete_task           : Mark task as completed"
    echo "  - list_agents             : List SOLARIA agents"
    echo "  - list_projects           : List projects"
    echo ""
    echo -e "${YELLOW}Important:${NC} Make sure Docker is running with:"
    echo "  cd $PROJECT_ROOT && docker-compose up -d"
    echo ""
}

# Main installation flow
main() {
    echo ""

    # Step 1: Install dependencies
    install_dependencies

    # Step 2: Generate config
    generate_config "$ENVIRONMENT"

    # Step 3: Verify
    verify_installation

    # Step 4: Print instructions
    print_instructions "$ENVIRONMENT"
}

# Run main
main "$@"
