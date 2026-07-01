/**
 * PM2 Ecosystem Configuration — Aethelis Sovereign Daemon
 *
 * This file configures the Aethelis telemetry daemon to run as a
 * permanent background service managed by PM2, with automatic restart
 * on crash and silent boot on system startup.
 *
 * Setup:
 *   npm install -g pm2
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup    (follow the printed instruction to enable boot persistence)
 */

module.exports = {
  apps: [
    {
      name: 'aethelis-daemon',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 8080,
      },
      // Silent logging
      out_file: './logs/aethelis-out.log',
      error_file: './logs/aethelis-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Silent boot — no popup window on desktop environments
      detached: true,
    },
  ],
};
