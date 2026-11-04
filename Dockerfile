# syntax=docker/dockerfile:1
# Teachback: Next.js production server in a container. Deploy guide: DEPLOY.md → "Docker".
#
# No Next.js standalone output on purpose: the running container must also be able to run
# `prisma migrate deploy` (on start) and `npm run demo:reset` (Prisma CLI + tsx + prisma/seed.ts,
# which imports lib/demo-responses.ts). Standalone only traces the server's own files, so the
# runtime image instead gets the full build: app, node_modules (incl. the Prisma CLI, its
# engines and tsx), prisma/ (schema, migrations, seed) and lib/.

FROM node:22-slim AS base
# openssl: Prisma detects its engine build (debian-openssl-3.0.x) from it — Prisma's docs list it
# for slim images. sqlite3: consistent backups (scripts/docker-backup.sh). ca-certificates: HTTPS to Gemini.
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates sqlite3 \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    CHECKPOINT_DISABLE=1

# ---- build: install everything (dev deps too: tsx, typescript, tailwind), generate Prisma, build Next
FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
# No database is needed here: every DB-backed page renders per request (checked with a build
# against a missing DB file). The DATABASE_URL default in the npm script only feeds `prisma generate`.
RUN npm run build && rm -rf .next/cache

# ---- runtime
FROM base AS runtime
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL=file:/app/data/teachback.db
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/data \
 && chown node:node /app/data \
 && chmod +x /app/docker/entrypoint.sh
# The official image's unprivileged user (uid/gid 1000).
USER node
EXPOSE 3000
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
ENTRYPOINT ["/app/docker/entrypoint.sh"]
