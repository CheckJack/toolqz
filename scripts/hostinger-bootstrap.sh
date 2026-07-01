#!/usr/bin/env bash
# One-time Hostinger VPS bootstrap (Ubuntu). Run as root or with sudo.
set -euo pipefail

echo "==> System packages"
apt-get update
apt-get install -y curl git nginx certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node.js 22 via NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing PM2"
  npm install -g pm2
  pm2 startup systemd -u "${SUDO_USER:-root}" --hp "/home/${SUDO_USER:-root}" || true
fi

echo "==> Bootstrap complete."
echo "Next steps:"
echo "  1. Clone repo to /var/www/toolqz (or your path)"
echo "  2. cp .env.example .env && edit production values"
echo "  3. Point domain A record to this server IP"
echo "  4. bash scripts/hostinger-deploy.sh"
echo "  5. Copy deploy/nginx.conf to /etc/nginx/sites-available/toolqz"
echo "  6. certbot --nginx -d yourdomain.com -d www.yourdomain.com"
