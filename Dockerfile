FROM oven/bun:1 AS base

WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --no-save --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=${NEXT_PUBLIC_UMAMI_WEBSITE_ID}
ARG NEXT_PUBLIC_UMAMI_URL
ENV NEXT_PUBLIC_UMAMI_URL=${NEXT_PUBLIC_UMAMI_URL}

# Build Next only — convex deploy runs at container start (needs live backend).
RUN bun run build:next

FROM base AS runner
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=${NEXT_PUBLIC_UMAMI_WEBSITE_ID}
ARG NEXT_PUBLIC_UMAMI_URL
ENV NEXT_PUBLIC_UMAMI_URL=${NEXT_PUBLIC_UMAMI_URL}

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --shell /usr/sbin/nologin nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Convex CLI + source for runtime deploy.
COPY --from=builder --chown=nextjs:nodejs /app/convex ./convex
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/bun.lock* ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/convex ./node_modules/convex
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "./server.js"]
