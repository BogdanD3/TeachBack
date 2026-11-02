// PM2 process file. Start with: pm2 start ecosystem.config.js
// Secrets come from .env in this folder (Next.js and Prisma load it themselves).
module.exports = {
  apps: [
    {
      name: "teachback",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      // One instance: rate limits and the dev-only caches are in memory, and SQLite likes a single writer.
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
      env: { NODE_ENV: "production" }, // DATABASE_URL etc. come from .env
      out_file: "logs/teachback.out.log",
      error_file: "logs/teachback.err.log",
      time: true,
    },
  ],
};
