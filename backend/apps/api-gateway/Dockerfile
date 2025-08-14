# Multi-stage build for API Gateway
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app

# Copy source code and dependencies
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the application
RUN npm run build --workspace=@gov-platform/types
RUN npm run build --workspace=@gov-platform/api-gateway

# Production stage
FROM base AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gateway

# Copy built application
COPY --from=builder --chown=gateway:nodejs /app/apps/api-gateway/dist ./dist
COPY --from=builder --chown=gateway:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api-gateway/package.json ./package.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Switch to non-root user
USER gateway

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
