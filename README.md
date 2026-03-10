# AI Notes

Monorepo for the AI Notes app: NestJS API + Next.js frontend.

## Structure

- **`backend/`** — NestJS API (PostgreSQL, Prisma, Hugging Face). See [backend/README.md](backend/README.md).
- **`frontend/`** — Next.js app (auth, notes CRUD, AI summarize/tags). See [frontend/README.md](frontend/README.md).

## Quick start

**Backend** (from repo root):

```bash
cd backend
pnpm install
cp .env.example .env   # edit with your DB and HF_TOKEN
pnpm run start:dev
```

**Frontend** (in another terminal):

```bash
cd frontend
pnpm install
pnpm run dev
```

- API: http://localhost:3000  
- App: http://localhost:3001  

## Deploy to AWS (Free Tier)

- **Infrastructure:** [infra/](infra/) – Terraform (VPC, EC2, RDS PostgreSQL).
- **Deploy configs:** [deploy/](deploy/) – Nginx, PM2, and deploy script.
- **Full guide:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) – step-by-step deployment, env vars, HTTPS, and CI/CD (GitHub Actions).
