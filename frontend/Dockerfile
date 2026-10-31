# =====================================================================
# WristAI - React.js Frontend Production Dockerfile for Railway
# =====================================================================

# Stage 1: Build the Vite production bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy frontend source code
COPY . .

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build client bundle into /app/dist
RUN npm run build

# Stage 2: Serve production assets with Node static server (handles SPA routing & Railway $PORT)
FROM node:20-alpine AS runner

WORKDIR /app

# Install lightweight static server
RUN npm install -g serve

# Copy built distribution files from builder
COPY --from=builder /app/dist ./dist

# Railway dynamically assigns $PORT
EXPOSE 5173

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --spider http://localhost:${PORT:-5173}/ || exit 1

# Start static file server with SPA fallback (-s) listening on Railway's $PORT
CMD ["sh", "-c", "serve -s dist -l ${PORT:-5173}"]

