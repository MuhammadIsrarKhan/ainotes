# AI Notes – AWS Free Tier deployment guide

Step-by-step deployment of the AI Notes monorepo (NestJS backend + Next.js frontend + PostgreSQL) on AWS within Free Tier.

## Architecture overview

- **EC2** (t2.micro): runs frontend (port 3000), backend (port 3001), and Nginx (80/443). Single instance.
- **RDS** (db.t2.micro): PostgreSQL in a private subnet; only EC2 can connect.
- **Nginx**: reverse proxy. Requests to `/api` go to the backend; everything else to the frontend.
- **Frontend** must call the API at the same origin with path `/api` (e.g. `https://yourdomain.com/api`). Set `NEXT_PUBLIC_API_URL` to that when building.

---

## Phase 1: Infrastructure (Terraform)

### 1.1 Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.0
- AWS CLI configured (`aws configure`) or environment variables
- An **EC2 key pair** in your chosen region (EC2 → Key Pairs → Create)

### 1.2 Provision

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # if you add the example file
# Edit terraform.tfvars: aws_region, project_name, ec2_key_name, ssh_cidr_blocks (your IP)

terraform init
terraform plan
terraform apply
```

### 1.3 Outputs

After apply:

```bash
terraform output ec2_public_ip    # e.g. 3.90.1.2
terraform output -raw db_password
terraform output rds_endpoint    # e.g. ai-notes-db.xxxx.us-east-1.rds.amazonaws.com:5432
```

Build **DATABASE_URL**:

```
postgresql://ainotes:<db_password>@<rds_endpoint>/ainotes?schema=public
```

Save this for the EC2 `.env` in Phase 2.

---

## Phase 2: EC2 setup (backend + frontend + Nginx)

### 2.1 SSH and one-time setup

Terraform user-data installs Node 20, pnpm, PM2, and Nginx. If you use your own AMI or skipped user-data, install them:

```bash
ssh -i your-key.pem ubuntu@<ec2_public_ip>

# If not already done by user-data:
# sudo apt update && sudo apt install -y curl git nginx
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt install -y nodejs
# sudo npm install -g pnpm pm2
```

### 2.2 Clone repo (first time only)

On EC2:

```bash
git clone https://github.com/YOUR_ORG/ainotes.git
cd ainotes
```

(Or create `ainotes` and use deploy script / GitHub Actions to populate it.)

### 2.3 Backend environment

On EC2, create `ainotes/backend/.env`:

```env
DATABASE_URL=postgresql://ainotes:<password>@<rds_endpoint>/ainotes?schema=public
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRES_IN=1d
HF_TOKEN=<your Hugging Face token>
HF_TEXT_MODEL=Qwen/Qwen2.5-7B-Instruct
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

Replace `<rds_endpoint>`, `<password>`, and `CORS_ORIGIN` (use your real domain or `http://<ec2_public_ip>` for testing).

### 2.4 Frontend build URL

The frontend must call the API at the same origin with path `/api`. When building (on your machine or in CI), set:

- **If you have a domain:** `NEXT_PUBLIC_API_URL=https://yourdomain.com/api`
- **If using EC2 IP only:** `NEXT_PUBLIC_API_URL=http://<ec2_public_ip>/api`

This is set at **build time**; the value is baked into the Next.js bundle.

### 2.5 Build and run (manual first deploy)

On your **local machine** (with Node 20 and pnpm):

```bash
# Backend
cd backend
pnpm install && pnpm run build && pnpm run prisma:generate
cd ..

# Frontend (set API URL first)
export NEXT_PUBLIC_API_URL=http://<ec2_public_ip>/api   # or https://yourdomain.com/api
cd frontend
pnpm install && pnpm run build
cd ..
```

Copy the repo (including `backend/dist`, `frontend/.next`, and `backend/.env`) to EC2, e.g. with rsync:

```bash
rsync -avz --exclude node_modules --exclude .next/cache backend/ ubuntu@<ec2_public_ip>:ainotes/backend/
rsync -avz --exclude node_modules --exclude .next/cache frontend/ ubuntu@<ec2_public_ip>:ainotes/frontend/
```

On **EC2**:

```bash
cd ainotes/backend
pnpm install --frozen-lockfile
pnpm run prisma migrate deploy
cd ../frontend
pnpm install --frozen-lockfile --prod
cd ..
pm2 start deploy/ecosystem.config.cjs
pm2 save && pm2 startup   # optional: restart on reboot
```

### 2.6 Nginx

Terraform user-data configures Nginx to proxy `/api` to port 3001 (backend) and `/` to port 3000 (frontend). If you need to adjust, copy from `deploy/nginx-ai-notes.conf` to `/etc/nginx/sites-available/default` and:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 2.7 Verify

- Open `http://<ec2_public_ip>`. You should see the Next.js app.
- Open `http://<ec2_public_ip>/api/docs` (or `/docs` if you proxy it). You should see Swagger.
- In the app, register and create a note to confirm API and DB work.

---

## Phase 3: Domain and HTTPS

### 3.1 Domain

Point your domain’s A record to the EC2 public IP (or Elastic IP from Terraform).

### 3.2 HTTPS (option A – Certbot on EC2)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Renewal is automatic via systemd/cron. Then set `CORS_ORIGIN=https://yourdomain.com` and rebuild/redeploy the frontend with `NEXT_PUBLIC_API_URL=https://yourdomain.com/api`.

### 3.3 HTTPS (option B – CloudFront + ACM)

1. Request an ACM certificate in **us-east-1** for your domain.
2. Create a CloudFront distribution: origin = EC2 (HTTP on port 80 or HTTPS if you already use Certbot), viewer protocol policy = Redirect HTTP to HTTPS.
3. Point your domain to the CloudFront URL (CNAME or A/ALIAS).
4. Restrict the EC2 security group to allow 80/443 only from the CloudFront prefix list if desired.

---

## Phase 4: CI/CD (GitHub Actions)

The workflow in `.github/workflows/deploy.yml` builds backend and frontend and deploys to EC2 on push to `main`.

### 4.1 GitHub configuration

- **Secrets**
  - `EC2_HOST`: e.g. `ubuntu@3.90.1.2`
  - `EC2_SSH_KEY`: contents of your `.pem` private key (the one you use for SSH)
- **Variables** (Settings → Secrets and variables → Actions)
  - `NEXT_PUBLIC_API_URL`: e.g. `https://yourdomain.com/api` (used when building the frontend)

### 4.2 First-time setup on EC2 for CI

- Create `ainotes` and ensure `backend/.env` exists on the server (create it once via SSH; do not put secrets in the repo).
- Ensure the EC2 key pair is the one whose private key is stored in `EC2_SSH_KEY`.
- Push to `main`; the workflow will rsync, run `prisma migrate deploy`, install deps, and reload PM2.

---

## Troubleshooting

- **502 Bad Gateway**: Backend or frontend not running. SSH and run `pm2 status` and `pm2 logs`.
- **CORS errors**: Set `CORS_ORIGIN` in `backend/.env` to the exact frontend origin (e.g. `https://yourdomain.com`). No trailing slash.
- **API 404 on /api/...**: Nginx must proxy `/api/` to `http://127.0.0.1:3001/` (trailing slashes matter so `/api/notes` becomes `/notes`).
- **Frontend calls wrong API**: Rebuild the frontend with the correct `NEXT_PUBLIC_API_URL` and redeploy.
- **RDS connection refused**: EC2 security group must allow outbound; RDS security group must allow 5432 from the EC2 security group. Check RDS is in the same VPC and that `DATABASE_URL` uses the RDS endpoint (not localhost).
- **Out of memory (t2.micro)**: Ensure only one instance of backend and frontend; consider increasing swap or moving to a larger instance after Free Tier.

---

## Cost and Free Tier

- **EC2 t2.micro**: 750 hours/month for 12 months.
- **RDS db.t2.micro**: 750 hours/month + 20 GB for 12 months.
- Set a **billing alarm** at $1 in AWS Budgets to avoid surprises.
- After 12 months, EC2 and RDS will incur charges unless you stop or delete them.
