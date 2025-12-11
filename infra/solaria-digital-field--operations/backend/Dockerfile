FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production || npm install --omit=dev
COPY . .
ENV PORT=3001 NODE_ENV=production
EXPOSE 3001
CMD ["node", "server.js"]
