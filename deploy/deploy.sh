#!/usr/bin/env bash
# Deploy AI Notes to EC2: build backend + frontend, sync to server, install deps, run migrations, restart PM2.
# Usage: ./deploy/deploy.sh [user@host]
# Requires: BACKEND_ENV and FRONTEND_ENV (or .env files on server), and SSH access.

set -e
HOST="${1:?Usage: $0 user@host}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "Building backend..."
cd backend
pnpm install --frozen-lockfile
pnpm run build
pnpm run prisma:generate
cd ..

echo "Building frontend..."
cd frontend
# API base URL: base URL + /api so backend is reached at https://yourdomain.com/api or http://IP/api
BASE_URL="http://${HOST#*@}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${BASE_URL}/api}"
echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
pnpm install --frozen-lockfile
pnpm run build
cd ..

echo "Syncing to $HOST..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next/cache' \
  --exclude 'backend/.env' \
  --exclude 'frontend/.env.local' \
  backend/ "$HOST:ainotes/backend/"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next/cache' \
  --exclude 'frontend/.env.local' \
  frontend/ "$HOST:ainotes/frontend/"
rsync -avz deploy/ "$HOST:ainotes/deploy/"

echo "Running on server: install, migrate, PM2 reload..."
ssh "$HOST" 'cd ainotes/backend && pnpm install --frozen-lockfile --prod && pnpm run prisma migrate deploy; cd ../frontend && pnpm install --frozen-lockfile --prod; cd .. && pm2 reload deploy/ecosystem.config.cjs --update-env || pm2 start deploy/ecosystem.config.cjs'

echo "Done. App should be live at http://$HOST (or your domain)."
