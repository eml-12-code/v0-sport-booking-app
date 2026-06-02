# syntax=docker/dockerfile:1

# ========================
# ===== Base Stage =======
# ========================

FROM node:22-alpine AS base

RUN apk add --no-cache tzdata
ENV TZ=Asia/Hong_Kong

# Install dependencies only when needed
FROM base AS deps


# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat


WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml ./

RUN pnpm --version

RUN pnpm install --no-frozen-lockfile

# ========================
# ===== Builder Stage ====
# ========================

FROM base AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

COPY lib/lua ./lib/lua

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ========================
# ===== Runner Stage =====
# ========================

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/lib/lua ./lib/lua

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
