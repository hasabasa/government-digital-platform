# Multi-stage build for Frontend Shell
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy source code and dependencies
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the application
RUN npm run build --workspace=@gov-platform/types
RUN npm run build --workspace=@gov-platform/frontend-shell

# Production stage
FROM nginx:alpine AS runner

# Install Node.js for potential server-side features
RUN apk add --no-cache nodejs npm

# Copy nginx configuration
COPY apps/frontend-shell/nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/apps/frontend-shell/dist /usr/share/nginx/html

# Copy environment script
COPY apps/frontend-shell/env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

# Set environment variables
ENV VITE_API_BASE_URL=http://localhost:8080/api/v1
ENV VITE_WS_URL=http://localhost:8080

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
