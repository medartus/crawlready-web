# CrawlReady Render Worker - Monorepo Edition
# Optimized for Fly.io deployment with minimal Puppeteer dependencies
# This uses ONLY the essential dependencies for headless Chromium

FROM node:20-slim

# Install ONLY the minimal dependencies for headless Chromium
# Each package is necessary:
# - chromium: The browser binary
# - ca-certificates: SSL/TLS certificate validation
# - fonts-liberation: Basic font rendering
# - libnss3, libnspr4: Security/crypto libraries for SSL
# - libgbm1: Graphics buffer management (required for GPU rendering)
# - libasound2: Audio library (even headless needs this)
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libnspr4 \
    libgbm1 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set Puppeteer environment BEFORE pnpm install to skip Chromium download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration files
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

# Install dependencies (Puppeteer will skip Chrome download)
RUN pnpm install --frozen-lockfile --filter @crawlready/render-worker...

# Copy workspace config and all source code
COPY tsconfig.base.json ./
COPY packages/ packages/
COPY apps/workers/render-worker/ apps/workers/render-worker/

# Set working directory to worker
WORKDIR /app/apps/workers/render-worker

# Set environment
ENV NODE_ENV=production

# Start worker with tsx (runs TypeScript directly)
CMD ["npx", "tsx", "index.ts"]
