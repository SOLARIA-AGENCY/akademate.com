# SOLARIA Digital Field Operations - Worker Service
# BullMQ workers for async task processing

FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY workers/package*.json ./
RUN npm ci --omit=dev

# Copy worker code
COPY workers/ ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('ioredis').default && console.log('ok')" || exit 1

CMD ["node", "index.js"]
