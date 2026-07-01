FROM node:20-alpine

WORKDIR /app

ENV PORT=8080
ENV NODE_ENV=production

# Install all deps
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY server.ts ./
COPY src/ ./src/
COPY drizzle.config.ts ./

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/reports || exit 1

# Start with tsx (supports TypeScript natively)
CMD ["node_modules/.bin/tsx", "server.ts"]
