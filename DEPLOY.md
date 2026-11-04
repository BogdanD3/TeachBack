# DEPLOY.md — Teachback on your own server

Two ways to run it; both put **Nginx + certbot** in front:

- **Docker (recommended)** — one container, SQLite in a Docker volume, published on `127.0.0.1:3001`. Section 0 below.
- **PM2 without Docker** — Node.js on the host, `next start` on `127.0.0.1:3000`. Sections 1–11.

## 0. Docker (recommended)

Files: `Dockerfile` (node:22-slim, multi-stage), `docker-compose.yml` (service `teachback`), `docker/entrypoint.sh`, `scripts/docker-backup.sh`, `scripts/docker-restore.sh`. Needs Docker Engine with the Compose plugin (`docker compose version`). Node.js on the host is optional; the `npm run docker:*` shortcuts just wrap the commands shown here.

What the container does:
- Runs as the unprivileged `node` user (uid 1000), `NODE_ENV=production`, listening on `0.0.0.0:3000` inside the container.
- Installs **npm 12.2.1** in the base stage before any npm command (`node:22` ships npm 10). This must match the npm version that wrote `package-lock.json`: if you upgrade npm locally and commit a new lockfile, update the `npm install -g npm@…` line in the `Dockerfile` too (`npm -v` shows yours). npm 12.2.1 needs Node ≥ 22.22.2; if the build fails at that step, run `docker pull node:22-slim` to get a current Node 22 image.
- On every start: `prisma migrate deploy`, then `next start`. It **never seeds or resets**.
- The database is `/app/data/teachback.db` in the named volume `teachback-data`. `docker-compose.yml` sets `DATABASE_URL=file:/app/data/teachback.db` under `environment:`, so it wins over a laptop value like `file:./dev.db` in `.env`.
- Everything else comes from `.env` (`env_file`): `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `PIP_THINKING`, `DEMO_MODE`, `SESSION_SECRET`. The app refuses to start without `DEMO_MODE` (`true`/`false`) or with a `SESSION_SECRET` under 32 characters, and the container then restarts in a loop with `[startup] …` in the logs.
- The port is published as `127.0.0.1:3001:3000`: reachable from the server itself (Nginx), never from outside.
- Healthcheck: `GET /api/health` every 30 s (`docker compose ps` shows `healthy`).

### 0.1 First start

```bash
git clone <your-repo-url> /srv/teachback && cd /srv/teachback      # any folder works
cp .env.example .env && chmod 600 .env && nano .env                 # values as in section 3; DATABASE_URL is ignored here
docker compose up -d --build            # build the image, start; migrations run automatically
docker compose ps                       # wait for "healthy" (~20 s)
curl -s http://127.0.0.1:3001/api/health    # {"ok":true,"db":true,"ai":"configured"}
docker compose exec teachback npm run demo:reset   # ONCE, for demo data (wipes the database!)
```

### 0.2 Logs, shell, AI check

```bash
docker compose logs -f teachback                    # "[entrypoint] …", "[ai] pip streamed by …"
docker compose exec teachback sh                    # shell inside the running container
docker compose exec teachback npm run ai:check      # which Gemini model answers + streaming speed
```

### 0.3 Update

```bash
cd /srv/teachback
bash scripts/docker-backup.sh                       # safety copy first
git pull --ff-only && docker compose up -d --build  # rebuilds, restarts; new migrations apply on start
docker image prune -f                               # drop the old image layers
```

(Same as `npm run docker:backup && npm run docker:update` if Node is installed on the host.) After changing only `.env`: `docker compose up -d` (recreates the container with the new values).

### 0.4 Backup and restore

```bash
bash scripts/docker-backup.sh      # → backups/teachback-YYYY-MM-DD_HHMMSS.db, keeps the newest 14
```

It takes a consistent `sqlite3 .backup` snapshot inside the running container, copies it out of the volume with `docker compose cp`, and deletes the older copies. Daily at 03:15 (`crontab -e` as a user that may run `docker`):

```cron
15 3 * * * cd /srv/teachback && bash scripts/docker-backup.sh >> backups/backup.log 2>&1
```

Restore (stops the app, keeps the current DB as `teachback.db.before-restore` in the volume, starts again):

```bash
bash scripts/docker-restore.sh backups/teachback-2026-11-04_031500.db
```

### 0.5 Demo reset

```bash
bash scripts/docker-backup.sh
docker compose exec teachback npm run demo:reset   # reseeds; the demo live event opens 3 minutes later
```

Then open `/library/photosynthesis/learn` once so the primer is generated again. For a scripted demo without the API: set `DEMO_MODE=true` in `.env`, then `docker compose up -d`.

### 0.6 Nginx in front of the container

Same as section 6, but proxy to **`127.0.0.1:3001`**:

```nginx
server {
    listen 80;
    server_name teachback.yourdomain.com;

    client_max_body_size 5m;            # voice recordings (≤ 60 s) go to /api/transcribe

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_read_timeout 60s;
    }

    # Pip's replies stream word by word: don't buffer them.
    location /api/teach/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}
```

Then `sudo nginx -t && sudo systemctl reload nginx` and `sudo certbot --nginx -d teachback.yourdomain.com`.

If your Nginx itself runs in a container, `127.0.0.1` is that container, not the server: put Nginx and `teachback` on a shared Docker network and use `proxy_pass http://teachback:3000;` instead (the `ports:` line is then optional).

### 0.7 Docker troubleshooting

| Symptom | Fix |
|---|---|
| Container keeps restarting, logs show `[startup] …` | Fix that `.env` value, then `docker compose up -d`. |
| `unhealthy` | `docker compose logs --tail 50 teachback`; `docker compose exec teachback node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.text()).then(console.log)"`. |
| `prisma migrate deploy` fails on start | A migration doesn't fit the DB: restore the last backup (0.4) and check the migration. |
| Build fails at `next build` fetching fonts | The build needs internet access (Google Fonts are downloaded at build time). |
| `502` from Nginx | `docker compose ps`; Nginx must point at `127.0.0.1:3001`. |
| Need a shell without starting the app | `docker compose run --rm --no-deps teachback sh` (arguments skip migrate + start). |

---

Sections 1–11 below are the **PM2 setup without Docker**. Target: a small Ubuntu 24.04 / Debian 12 VPS (1 vCPU, 1 GB RAM is enough). SQLite lives on the server's disk, so there is no database service. Stack: Node.js LTS → `next start` under **PM2** on `127.0.0.1:3000` → **Nginx** reverse proxy → **certbot** for HTTPS.

Commands marked `sudo` run as root; everything else runs as a normal deploy user (below: `deploy`, home `/home/deploy`).

## 1. Server basics (once)

```bash
# as root (or a sudo user)
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx certbot python3-certbot-nginx sqlite3 ufw
sudo adduser --disabled-password --gecos "" deploy      # skip if you already have a user
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable
```

`sqlite3` is optional but lets `scripts/backup-db.sh` take consistent backups while the app is running.

Point a DNS `A` record (e.g. `teachback.yourdomain.com`) at the server's IP now; certbot needs it in step 6.

## 2. Node.js LTS and PM2 (as `deploy`)

```bash
sudo -iu deploy
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts && nvm alias default 'lts/*'
node -v                      # v22+ / v24+
npm install -g pm2
```

## 3. Clone and configure

```bash
git clone <your-repo-url> ~/teachback && cd ~/teachback
cp .env.example .env
chmod 600 .env
nano .env
```

`.env` on the server:

```
GEMINI_API_KEY=<your key>
GEMINI_MODEL=gemini-3.6-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash
PIP_THINKING=low
DEMO_MODE=false
SESSION_SECRET=<output of: openssl rand -hex 32>
DATABASE_URL="file:./dev.db"
```

The server **refuses to start** in production (PM2 shows `errored`, the log line starts with `[startup]`) when:
- `SESSION_SECRET` is missing or shorter than 32 characters (`openssl rand -hex 32` gives 64),
- `DEMO_MODE` is not set to `true` or `false` (demo mode must be a deliberate choice).

`PIP_THINKING` (`off` | `low` | `medium`, default `low`) sets how long Pip thinks before answering; `low` is the speed/quality sweet spot.

## 4. First install

```bash
cd ~/teachback
npm ci                       # package.json "allowScripts" lets Prisma + esbuild run their install scripts
npm run db:deploy            # creates prisma/dev.db and applies all migrations
npm run db:seed              # ONCE on a new server: topics, demo data, demo@teachback.app / demo1234
npm run build                # prisma generate + next build
npm run ai:check             # optional: which Gemini model answers, and Pip's streaming speed
```

Never run `db:seed` or `demo:reset` on a server with real users: both wipe the data. Updates (section 7) never seed.

## 5. Run with PM2

```bash
mkdir -p logs
pm2 start ecosystem.config.js     # `next start` on 127.0.0.1:3000, one instance, NODE_ENV=production
pm2 save
pm2 startup                       # prints a `sudo env PATH=… pm2 startup …` line: run it, so PM2 starts on boot
curl -s http://127.0.0.1:3000/api/health   # {"ok":true,"db":true,"ai":"configured"}
pm2 logs teachback                # "[ai] pip streamed by <model>: first text … ms" etc.
```

Keep **one** instance: rate limits live in memory and SQLite prefers a single writer.

## 6. Nginx and HTTPS

`sudo nano /etc/nginx/sites-available/teachback`:

```nginx
server {
    listen 80;
    server_name teachback.yourdomain.com;

    client_max_body_size 5m;            # voice recordings (≤ 60 s) are uploaded to /api/transcribe

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_read_timeout 60s;
    }

    # Pip's replies stream word by word: don't buffer them.
    location /api/teach/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/teachback /etc/nginx/sites-enabled/teachback
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d teachback.yourdomain.com     # adds the 443 server + HTTP→HTTPS redirect
sudo certbot renew --dry-run                         # renewal runs automatically (systemd timer)
curl -s https://teachback.yourdomain.com/api/health
```

Why the headers matter:
- `X-Real-IP` / `X-Forwarded-For`: BotLens and the rate limits see the visitor's IP, not `127.0.0.1`.
- `X-Forwarded-Host` / `X-Forwarded-Proto`: referral links and Open Graph URLs use your public `https://` domain.
- HTTPS is required for the microphone (browsers block it on plain HTTP) and for the session cookie, which is `Secure` in production.
- The streaming route also sends `X-Accel-Buffering: no`; the `proxy_buffering off` block makes it explicit.

## 7. Updating

```bash
cd ~/teachback && bash scripts/deploy.sh
```

`scripts/deploy.sh` does, in order: backup the database (`scripts/backup-db.sh`) → `git pull --ff-only` → `npm ci` → `npm run db:deploy` (migrations only) → `npm run build` → `pm2 startOrRestart ecosystem.config.js --update-env` → `pm2 save` → waits for `/api/health`. It **never seeds or resets**. If the health check fails it prints where to look (`pm2 logs teachback --lines 50`).

After changing `.env` only: `pm2 restart teachback --update-env`.

## 8. Backups

`scripts/backup-db.sh` copies `prisma/dev.db` to `backups/dev-YYYY-MM-DD_HHMMSS.db` (using `sqlite3 .backup` when available, so it's safe while the app writes) and keeps the newest 14. `backups/` is git-ignored.

Daily at 03:15, as `deploy` (`crontab -e`):

```cron
15 3 * * * cd /home/deploy/teachback && bash scripts/backup-db.sh >> logs/backup.log 2>&1
```

Restore: `pm2 stop teachback && cp backups/dev-<stamp>.db prisma/dev.db && pm2 start teachback`. Copy `backups/` off the server now and then (e.g. `scp` or `rsync` from your laptop).

## 9. Uptime checks

`GET /api/health` → `{"ok":true,"db":true,"ai":"configured"}` (HTTP 200), or `"db":false` with HTTP 503 when the database doesn't answer. `ai` is `"demo"` when `DEMO_MODE=true` or no key is set. No secrets or model names are exposed. Point UptimeRobot / Better Stack (or a cron `curl -fsS`) at `https://teachback.yourdomain.com/api/health`.

## 10. Before the demo

```bash
cd ~/teachback
bash scripts/backup-db.sh
npm run demo:reset           # reseeds (wipes data!); the demo live event opens for booking 3 minutes later
npm run ai:check             # if both models fail → set DEMO_MODE=true (below)
```

Then open `/library/photosynthesis/learn` once so the primer is generated and cached. Bad Wi-Fi or Gemini limits: set `DEMO_MODE=true` in `.env`, then `pm2 restart teachback --update-env`. The Photosynthesis demo is fully scripted in demo mode, and the app also falls back to demo answers on its own when both models fail. Click path: `DEMO.md`.

## 11. Troubleshooting

| Symptom | Fix |
|---|---|
| PM2 shows `errored`, log has `[startup] …` | Fix the named `.env` setting (`SESSION_SECRET` ≥ 32 chars, `DEMO_MODE=true/false`), then `pm2 restart teachback --update-env`. |
| `502 Bad Gateway` | `pm2 status`; the app must listen on `127.0.0.1:3000`. `pm2 logs teachback`. |
| `/api/health` says `"db":false` | `ls -l prisma/dev.db`; run `npm run db:deploy`; check file permissions (owned by `deploy`). |
| Pip's reply appears all at once | Nginx buffers it: check the `location /api/teach/` block with `proxy_buffering off`. |
| Voice upload fails with 413 | `client_max_body_size 5m;` missing in the Nginx server block. |
| Everyone's IP is `127.0.0.1` | The `proxy_set_header X-Real-IP / X-Forwarded-For` lines are missing. |
| Mic button missing | The site isn't on HTTPS (browsers only allow the microphone on HTTPS or localhost), or the browser lacks MediaRecorder. |
| Login works but you're logged out immediately | You're on `http://`: the session cookie is `Secure`. Use the HTTPS URL. |
| Pip answers feel canned | `DEMO_MODE=true`, or the API failed — `pm2 logs` shows `[ai] … failed on …`; `/api/health` shows `"ai":"demo"` when no key is set. |
