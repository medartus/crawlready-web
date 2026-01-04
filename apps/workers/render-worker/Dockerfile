# Multi-stage build for CrawlReady Render Worker
# Optimized for monorepo with pnpm workspaces

# Stage 1: Dependencies
FROM node:20-slim AS deps
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all package.json files for dependency resolution
COPY packages/types/package.json packages/types/
COPY packages/logger/package.json packages/logger/
COPY packages/database/package.json packages/database/
COPY packages/cache/package.json packages/cache/
COPY packages/queue/package.json packages/queue/
COPY packages/storage/package.json packages/storage/
COPY packages/security/package.json packages/security/
COPY apps/workers/render-worker/package.json apps/workers/render-worker/

# Install only render-worker dependencies (with workspace packages)
RUN pnpm install --frozen-lockfile --filter @crawlready/render-worker...

# Stage 2: Runner (no build step needed, tsx runs TypeScript directly)
FROM node:20-slim AS runner

# Install Chromium and dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy all source code (workspace packages + worker)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/workers/render-worker/node_modules ./apps/workers/render-worker/node_modules

# Copy workspace config
COPY pnpm-workspace.yaml tsconfig.base.json ./

# Copy package source files
COPY packages/ packages/
COPY apps/workers/render-worker/ apps/workers/render-worker/

WORKDIR /app/apps/workers/render-worker

ENV NODE_ENV=production

# Run with tsx (TypeScript execution)
CMD ["npx", "tsx", "index.ts"]
