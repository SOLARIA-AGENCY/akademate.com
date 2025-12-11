# Single-container "office" image: dashboard + MySQL
FROM node:22-bookworm

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
 && apt-get install -y --no-install-recommends mariadb-server curl \
 && rm -rf /var/lib/apt/lists/*

# Create mysql user data dir
RUN mkdir -p /var/run/mysqld /var/lib/mysql /docker-entrypoint-initdb.d \
 && chown -R mysql:mysql /var/run/mysqld /var/lib/mysql /docker-entrypoint-initdb.d

# Dashboard app
WORKDIR /app
COPY dashboard/package*.json ./
RUN npm install --omit=dev
COPY dashboard/. .

# Init SQL
COPY infrastructure/database/mysql-init.sql /docker-entrypoint-initdb.d/01-init.sql

# Entrypoint script
COPY office-entrypoint.sh /usr/local/bin/office-entrypoint.sh
RUN chmod +x /usr/local/bin/office-entrypoint.sh

EXPOSE 3030 3306
VOLUME ["/var/lib/mysql", "/app/logs"]

ENV DB_PASSWORD=SolariaField2024! \
    MYSQL_ROOT_PASSWORD=SolariaRoot2024! \
    DB_NAME=solaria_construction \
    DB_USER=solaria_user \
    JWT_SECRET=solaria_akademate_jwt_secret_2024_production_min32chars \
    NODE_ENV=production \
    PORT=3030

ENTRYPOINT ["/usr/local/bin/office-entrypoint.sh"]
