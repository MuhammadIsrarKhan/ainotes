#!/bin/bash
# EC2 user data: install Node.js, pnpm, PM2, Nginx (app deploy is via deploy script or CI/CD)
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get install -y curl git nginx

# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# pnpm
npm install -g pnpm

# PM2
npm install -g pm2

# Nginx: frontend on /, API under /api (strip prefix when proxying to backend)
cat > /etc/nginx/sites-available/default << 'NGINX_DEFAULT'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_DEFAULT
nginx -t && systemctl enable nginx && systemctl start nginx || true

echo "User data completed. Deploy app using deploy/deploy.sh or GitHub Actions."
