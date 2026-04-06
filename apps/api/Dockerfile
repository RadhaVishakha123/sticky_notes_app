# ─── Stage 1: Dependency installer ──────────────────────────
FROM node:22-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json        ./packages/types/
COPY packages/tsconfig/package.json     ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY apps/api/package.json              ./apps/api/

RUN pnpm install --no-frozen-lockfile --ignore-scripts

# ─── Stage 2: Builder ────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache openssl
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json            ./apps/api/

COPY --from=deps /app/node_modules              ./node_modules
COPY --from=deps /app/apps/api/node_modules     ./apps/api/node_modules

COPY tsconfig.base.json ./
COPY packages/          ./packages/
COPY apps/api/          ./apps/api/

RUN pnpm --filter api run db:generate
RUN pnpm --filter api run build

# ─── Stage 3: Production runner ──────────────────────────────
FROM node:22-alpine AS runner

# openssl required by Prisma on Alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules              ./node_modules
COPY --from=builder /app/apps/api/node_modules     ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist             ./apps/api/dist
COPY --from=builder /app/apps/api/prisma           ./apps/api/prisma

# Create non-root user and grant ownership BEFORE switching
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 apiuser \
  && chown -R apiuser:nodejs /app

USER apiuser

EXPOSE 3000

CMD ["sh", "-c", "apps/api/node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/index.js"]
