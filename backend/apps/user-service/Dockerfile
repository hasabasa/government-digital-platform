# Multi-stage build for User Service
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/types/package.json ./packages/types/
COPY packages/database/package.json ./packages/database/

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
RUN npm run build --workspace=@gov-platform/database
RUN npm run build --workspace=@gov-platform/user-service

# Production stage
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 userservice

# Copy built application
COPY --from=builder --chown=userservice:nodejs /app/apps/user-service/dist ./dist
COPY --from=builder --chown=userservice:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=userservice:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/user-service/package.json ./package.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Switch to non-root user
USER userservice

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
