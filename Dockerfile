# Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server

# Production Stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

EXPOSE 3000
ENV PORT=3000

# SECURITY: Set this token in production!
# If not set, the server will rely strictly on network-level access control with no token auth.
ENV ASTRA_SERVER_TOKEN=""

# Default CORS policy: strict same-origin. Override for cross-domain access.
ENV CORS_ORIGIN=""

CMD ["node", "dist/server/main/server/index.js"]
