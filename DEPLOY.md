# DEPLOY.md — Teachback on your own server (PM2 + Nginx + certbot)

Tested target: a small Ubuntu/Debian VPS (1 vCPU, 1 GB RAM is enough). SQLite lives on the server's disk, so no database service is needed.

## 1. Prerequisites (once)

```bash
sudo apt update && sudo apt install -y git nginx certbot python3-certbot-nginx
# Node.js LTS (22+). With nvm, as your deploy user:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc && nvm install --lts
npm install -g pm2
```

Point a DNS `A` record (e.g. `teachback.yourdomain.com`) at the server before step 5.

## 2. Clone, configure, build

```bash
git clone <your-repo-url> ~/teachback && cd ~/teachback
npm ci                       # package.json "allowScripts" lets Prisma + esbuild run their install scripts
cp .env.example .env
nano .env                    # fill in the values below
```

`.env` on the server:

```
GEMINI_API_KEY=<your key>
GEMINI_MODEL=gemini-3.6-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash
DEMO_MODE=false
SESSION_SECRET=<output of: openssl rand -hex 32>
DATABASE_URL="file:./dev.db"
```

`SESSION_SECRET` is required in production: without it the server exits at startup with `[startup] SESSION_SECRET is not set`.

```bash
npm run db:deploy            # apply migrations (creates prisma/dev.db)
npm run db:seed              # realistic demo data + demo account demo@teachback.app / demo1234
npm run build                # prisma generate + next build
npm run ai:check             # optional: confirms which Gemini model answers
```

## 3. Run with PM2

```bash
mkdir -p logs
pm2 start ecosystem.config.js     # runs `next start` on 127.0.0.1:3000, one instance
pm2 save
pm2 startup                       # prints a sudo command — run it so PM2 starts on boot
pm2 logs teachback                # watch logs (shows "[ai] … answered by <model>")
```

Keep **one** instance: rate limits are in memory and SQLite prefers a single writer.

## 4. Nginx reverse proxy

`/etc/nginx/sites-available/teachback`:

```nginx
server {
    listen 80;
    server_name teachback.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/teachback /etc/nginx/sites-enabled/teachback
sudo nginx -t && sudo systemctl reload nginx
```

The `X-Real-IP` / `X-Forwarded-For` headers matter for BotLens: without them every visitor looks like `127.0.0.1`. `X-Forwarded-Host/Proto` make referral links and Open Graph URLs use your public domain.

## 5. HTTPS

```bash
sudo certbot --nginx -d teachback.yourdomain.com
```

The microphone (voice input) only works over HTTPS. Session cookies are `Secure` in production.

## 6. Updating

```bash
cd ~/teachback
cp prisma/dev.db "prisma/dev.db.bak-$(date +%F-%H%M)"   # backup first
git pull && npm ci && npm run db:deploy && npm run build && pm2 restart teachback
```

## 7. Before the demo

```bash
cp prisma/dev.db "prisma/dev.db.bak-$(date +%F-%H%M)"
npm run demo:reset           # reseed; the demo live event opens for booking 3 minutes later
npm run ai:check             # if both models fail → see below
```

Bad Wi-Fi or Gemini limits: set `DEMO_MODE=true` in `.env`, then `pm2 restart teachback --update-env`. The Photosynthesis demo is fully scripted in demo mode. The app also falls back to demo mode automatically when both models fail.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| PM2 shows `errored`, log says `SESSION_SECRET is not set` | Add it to `.env`, `pm2 restart teachback --update-env`. |
| `502 Bad Gateway` | `pm2 status`; the app must listen on `127.0.0.1:3000`. |
| Everyone's IP is `127.0.0.1` | The Nginx `proxy_set_header` lines are missing. |
| Mic button missing | Browser doesn't support Web Speech (Firefox) or the site isn't on HTTPS. |
| Pip answers feel canned | `DEMO_MODE=true`, or the API failed — check `pm2 logs` for `[ai] … failed on …`. |
