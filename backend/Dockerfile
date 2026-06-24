# Dockerfile for Clinidata backend
# syntax=docker/dockerfile:1.4

# --- Builder stage ---
FROM node:18-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run prisma:generate
RUN npm run build

# --- Production stage ---
FROM node:18-slim AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
RUN addgroup --system app && adduser --system --ingroup app appuser
USER appuser
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "require('http').get('http://localhost:3000/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "dist/index.js"]
