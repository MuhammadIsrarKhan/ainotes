# Deploy scripts and configs

- **nginx-ai-notes.conf** – Nginx reverse proxy: `/api` → backend (3000), `/` → frontend (3001). Use with Terraform user-data or copy to `/etc/nginx/sites-available/default` on EC2.
- **ecosystem.config.cjs** – PM2 config to run backend and frontend. From repo root: `pm2 start deploy/ecosystem.config.cjs`. Save: `pm2 save` and `pm2 startup`.
- **deploy.sh** – Build locally, rsync to EC2, run migrations, reload PM2. Set `NEXT_PUBLIC_API_URL` (e.g. `https://yourdomain.com/api`) before running so the frontend build points to your API.

On EC2, ensure:
- `backend/.env` has `DATABASE_URL`, `JWT_SECRET`, `HF_TOKEN`, `CORS_ORIGIN`, etc.
- Frontend was built with correct `NEXT_PUBLIC_API_URL` (same origin with `/api` or full API URL).
