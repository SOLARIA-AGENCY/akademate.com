FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json ./
RUN npm install --omit=dev

# Copy application files
COPY server.js ./
COPY public ./public/

# Expose port (uses PORT env variable, default 3030)
EXPOSE 3030

# Health check - use environment variable PORT with default 3030
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3030}/api/health || exit 1

# Start server
CMD ["node", "server.js"]
