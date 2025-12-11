FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy server
COPY server.js ./

# Environment variables
ENV DASHBOARD_API_URL=http://dashboard-backend:3000/api
ENV DASHBOARD_USER=carlosjperez
ENV DASHBOARD_PASS=bypass

# Run server
CMD ["node", "server.js"]
