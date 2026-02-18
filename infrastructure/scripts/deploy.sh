#!/bin/bash
# Akademate.com - Deployment Script
# Usage: ./deploy.sh [environment] [service]
# Example: ./deploy.sh production all

set -e

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DOCKER_DIR="${PROJECT_ROOT}/infrastructure/docker"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi

    log_success "All requirements met"
}

load_env() {
    local env_file="${DOCKER_DIR}/.env"

    if [ -f "$env_file" ]; then
        log_info "Loading environment from ${env_file}"
        set -a
        source "$env_file"
        set +a
    else
        log_warning ".env file not found. Using defaults."
    fi
}

build_services() {
    local service=$1

    log_info "Building services..."
    cd "$DOCKER_DIR"

    if [ "$service" == "all" ]; then
        docker compose build
    else
        docker compose build "$service"
    fi

    log_success "Build completed"
}

deploy_services() {
    local service=$1

    log_info "Deploying services..."
    cd "$DOCKER_DIR"

    if [ "$service" == "all" ]; then
        docker compose up -d
    else
        docker compose up -d "$service"
    fi

    log_success "Deployment completed"
}

run_migrations() {
    log_info "Running database migrations..."

    docker compose exec -T payload pnpm db:migrate

    log_success "Migrations completed"
}

http_check() {
    local url="$1"
    if command -v curl &> /dev/null; then
        curl -s -f "$url" > /dev/null 2>&1
    elif command -v wget &> /dev/null; then
        wget -q --spider "$url" > /dev/null 2>&1
    else
        log_error "Neither curl nor wget is available for health checks"
        return 1
    fi
}

health_check() {
    log_info "Running health checks..."

    local max_retries=30
    local retry_count=0

    # Check Payload CMS
    while [ $retry_count -lt $max_retries ]; do
        if http_check "http://localhost:${PAYLOAD_PORT:-3003}/api/health"; then
            log_success "Payload CMS is healthy"
            break
        fi
        retry_count=$((retry_count + 1))
        sleep 2
    done

    if [ $retry_count -eq $max_retries ]; then
        log_error "Payload CMS health check failed"
        return 1
    fi

    # Check Web App
    retry_count=0
    while [ $retry_count -lt $max_retries ]; do
        if http_check "http://localhost:${WEB_PORT:-3006}"; then
            log_success "Web App is healthy"
            break
        fi
        retry_count=$((retry_count + 1))
        sleep 2
    done

    if [ $retry_count -eq $max_retries ]; then
        log_error "Web App health check failed"
        return 1
    fi

    log_success "All health checks passed"
}

show_status() {
    log_info "Service Status:"
    cd "$DOCKER_DIR"
    docker compose ps
}

# =============================================================================
# Main
# =============================================================================

main() {
    local environment="${1:-production}"
    local service="${2:-all}"

    echo ""
    echo "======================================"
    echo "  Akademate.com Deployment"
    echo "  Environment: ${environment}"
    echo "  Service: ${service}"
    echo "======================================"
    echo ""

    check_requirements
    load_env

    case "$environment" in
        production|prod)
            export NODE_ENV=production
            ;;
        staging)
            export NODE_ENV=staging
            ;;
        development|dev)
            export NODE_ENV=development
            ;;
        *)
            log_error "Unknown environment: $environment"
            exit 1
            ;;
    esac

    build_services "$service"
    deploy_services "$service"

    if [ "$service" == "all" ] || [ "$service" == "payload" ]; then
        sleep 10  # Wait for services to start
        run_migrations
    fi

    health_check
    show_status

    echo ""
    log_success "Deployment completed successfully!"
    echo ""
    echo "Access the services at:"
    echo "  - Web:     http://localhost:${WEB_PORT:-3006}"
    echo "  - Admin:   http://localhost:${ADMIN_PORT:-3004}"
    echo "  - API:     http://localhost:${PAYLOAD_PORT:-3003}"
    echo ""
}

# Run main function
main "$@"
