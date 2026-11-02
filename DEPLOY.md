# DEPLOY.md — Teachback on a fresh Linux server

Target: a small Ubuntu 24.04 / Debian 12 VPS (1 vCPU, 1 GB RAM is enough). SQLite lives on the server's disk, so there is no database service. Stack: Node.js LTS → `next start` under **PM2** on `127.0.0.1:3000` → **Nginx** reverse proxy → **certbot** for HTTPS.

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
