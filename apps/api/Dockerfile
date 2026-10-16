# Production Dockerfile for ClinicQ API
FROM oven/bun:1.2.4-alpine AS base
WORKDIR /app

# Install dependencies into temp directory to cache them
FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
COPY apps/api/package.json /temp/prod/apps/api/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Build stage
FROM base AS prerelease
COPY --from=install /temp/prod/node_modules node_modules
COPY . .
RUN cd apps/api && bunx prisma generate
RUN cd apps/api && bun run build

# Production release
FROM oven/bun:1.2.4-alpine AS release
WORKDIR /app

COPY --from=prerelease /app/apps/api/dist/server.js ./server.js
COPY --from=prerelease /app/apps/api/prisma ./prisma
COPY --from=prerelease /app/node_modules ./node_modules

EXPOSE 4000
ENV NODE_ENV=production
CMD ["bun", "run", "server.js"]
