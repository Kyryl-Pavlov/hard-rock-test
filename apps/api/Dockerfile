# Build context: repository root (see docker-compose.yml)
#   docker build -f apps/api/Dockerfile .

FROM node:24-slim AS base
ENV TURBO_TELEMETRY_DISABLED=1
WORKDIR /app

# 1. Prune the monorepo down to @rme/api and its workspace dependencies
FROM base AS pruner
RUN npm install -g turbo@2.11.10
COPY . .
RUN turbo prune @rme/api --docker

# 2. Install deps (cached while package.json files are unchanged), then build
FROM base AS builder
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm ci
COPY --from=pruner /app/out/full/ .
RUN npx turbo run build --filter=@rme/api
RUN npm prune --omit=dev

# 3. Minimal runtime image
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /app .
USER node
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/index.js"]
