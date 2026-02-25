# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install Python and build tools for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server && npm run build:vite

# Production Stage
FROM node:20-alpine
WORKDIR /app

# node-pty requires native build tools
RUN apk add --no-cache python3 make g++

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && apk del python3 make g++

# Make sure dist/server/renderer exists (create it if needed, though build:vite should populate it)
# If build:vite outputs to dist/renderer, we need to ensure the server finds it at dist/server/renderer
# or update the server path.
# Assuming vite builds to dist/renderer (based on standard configs), we copy it there.
# Adjusting copy command to include all of dist which should have both server and renderer.


EXPOSE 3000
ENV PORT=3000

# SECURITY: Set this token in production!
# If not set, the server will rely strictly on network-level access control with no token auth.
ENV ASTRA_SERVER_TOKEN=""

# Default CORS policy: strict same-origin. Override for cross-domain access.
ENV CORS_ORIGIN=""

CMD ["node", "dist/server/main/server/index.js"]
