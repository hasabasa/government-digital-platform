FROM node:18-alpine

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/finance-service ./apps/finance-service

# Install dependencies
RUN npm install --workspace=apps/finance-service

# Build shared packages
RUN npm run build --workspace=packages/types --if-present
RUN npm run build --workspace=packages/database --if-present

# Build service
RUN npm run build --workspace=apps/finance-service

WORKDIR /app/apps/finance-service

EXPOSE 3007

CMD ["node", "dist/index.js"]
