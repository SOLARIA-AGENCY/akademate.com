#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# SOLARIA Digital Field Operations - Office Entrypoint
# Version: 2.0.0
# NOTA: Passwords sin caracteres especiales para evitar problemas de escaping
# =============================================================================

# Defaults (sin caracteres especiales)
DB_PASSWORD=${DB_PASSWORD:-solaria2024}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-SolariaRoot2024}
DB_NAME=${DB_NAME:-solaria_construction}
DB_USER=${DB_USER:-solaria_user}
PORT=${PORT:-3030}

echo "[office] Starting SOLARIA Digital Field Operations..."
echo "[office] DB_NAME=${DB_NAME}, DB_USER=${DB_USER}, PORT=${PORT}"

# Ensure permissions
chown -R mysql:mysql /var/lib/mysql /var/run/mysqld

# Initialize MariaDB if missing
if [ ! -d /var/lib/mysql/mysql ]; then
  echo "[office] Initializing MariaDB data directory..."
  mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/dev/null
  echo "[office] MariaDB initialized"
fi

# Start MariaDB in background
echo "[office] Starting MariaDB..."
mariadbd --user=mysql --bind-address=0.0.0.0 &
MYSQL_PID=$!

# Wait for MariaDB with timeout
echo "[office] Waiting for MariaDB to be ready..."
for i in {1..30}; do
  if mariadb-admin ping --silent 2>/dev/null; then
    echo "[office] MariaDB is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "[office] ERROR: MariaDB failed to start"
    exit 1
  fi
  sleep 1
done

# Setup database - fresh install has no root password
if mariadb -uroot -e "SELECT 1" 2>/dev/null; then
  echo "[office] Fresh install detected - configuring database..."

  # Single transaction for all setup
  mariadb -uroot <<EOSQL
-- Set root password
SET PASSWORD FOR 'root'@'localhost' = PASSWORD('${MYSQL_ROOT_PASSWORD}');

-- Create database
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create application user for all hosts
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOSQL

  if [ $? -eq 0 ]; then
    echo "[office] Database and user configured successfully"
  else
    echo "[office] ERROR: Failed to configure database"
    exit 1
  fi
else
  echo "[office] Existing installation detected - using credentials"
fi

# Import schema (idempotent)
echo "[office] Importing database schema..."
if mariadb -uroot -p"${MYSQL_ROOT_PASSWORD}" ${DB_NAME} < /docker-entrypoint-initdb.d/01-init.sql 2>/dev/null; then
  echo "[office] Schema imported"
else
  echo "[office] Schema already exists or import skipped"
fi

# Normalize dashboard passwords (SHA256 of 'bypass')
# bypass -> f271a122bf4230c7c217b4cb8a66f8b4325b9c1821627dca16924fff32d6aa71
echo "[office] Setting dashboard passwords..."
mariadb -uroot -p"${MYSQL_ROOT_PASSWORD}" ${DB_NAME} -e \
  "UPDATE users SET password_hash='f271a122bf4230c7c217b4cb8a66f8b4325b9c1821627dca16924fff32d6aa71'" 2>/dev/null || true

# Verify setup
USER_COUNT=$(mariadb -uroot -p"${MYSQL_ROOT_PASSWORD}" ${DB_NAME} -sN -e "SELECT COUNT(*) FROM users" 2>/dev/null || echo "0")
PROJECT_COUNT=$(mariadb -uroot -p"${MYSQL_ROOT_PASSWORD}" ${DB_NAME} -sN -e "SELECT COUNT(*) FROM projects" 2>/dev/null || echo "0")
echo "[office] Database status: ${USER_COUNT} users, ${PROJECT_COUNT} projects"

# Test application user connection
if mariadb -u"${DB_USER}" -p"${DB_PASSWORD}" ${DB_NAME} -e "SELECT 1" >/dev/null 2>&1; then
  echo "[office] Application user connection verified"
else
  echo "[office] WARNING: Application user connection failed - fixing..."
  mariadb -uroot -p"${MYSQL_ROOT_PASSWORD}" -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}'; FLUSH PRIVILEGES;" 2>/dev/null || true
fi

# Export environment for Node.js dashboard
export DB_HOST=127.0.0.1
export DB_USER="${DB_USER}"
export DB_PASSWORD="${DB_PASSWORD}"
export DB_NAME="${DB_NAME}"
export PORT="${PORT}"

# Start dashboard
echo "[office] Starting dashboard on port ${PORT}..."
cd /app
node server.js &
NODE_PID=$!

# Wait for dashboard to be ready
sleep 2
if curl -s http://localhost:${PORT}/api/health >/dev/null 2>&1; then
  echo "[office] Dashboard is healthy"
else
  echo "[office] WARNING: Dashboard health check pending"
fi

echo "============================================="
echo "[office] SOLARIA Digital Field Operations"
echo "[office] Dashboard: http://localhost:${PORT}"
echo "[office] Credentials: carlosjperez / bypass"
echo "[office] Database: ${DB_USER}@localhost:3306/${DB_NAME}"
echo "============================================="

# Trap for graceful shutdown
trap 'echo "[office] Shutting down..."; kill ${NODE_PID} ${MYSQL_PID} 2>/dev/null; wait' SIGTERM SIGINT

# Keep container running
wait
