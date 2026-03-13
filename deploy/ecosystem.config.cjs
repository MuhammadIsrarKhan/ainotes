/**
 * PM2 ecosystem file for AI Notes (backend + frontend).
 * Run from repo root: pm2 start deploy/ecosystem.config.cjs
 * Ensure backend/.env and frontend .env (NEXT_PUBLIC_API_URL) are set.
 */
module.exports = {
  apps: [
    {
      name: 'ai-notes-backend',
      cwd: './backend',
      script: 'node',
      args: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
      env_file: '.env',
    },
    {
      name: 'ai-notes-frontend',
      cwd: './frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
