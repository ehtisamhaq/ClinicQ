# Production Dockerfile for ClinicQ API
FROM oven/bun:1.2.4-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN bun install

# Copy application source code and prisma schema
COPY . .

# Generate Prisma client and build server bundle
RUN bunx prisma generate
RUN bun run build

EXPOSE 10000
ENV NODE_ENV=production
ENV PORT=10000

CMD ["bun", "run", "dist/server.js"]
