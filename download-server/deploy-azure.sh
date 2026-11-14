#!/usr/bin/env bash
set -e

# Toolverse Azure VM Deployment Script
# Automates Docker setup, Caddy SSL reverse proxy, and yt-backend.

echo "============================================="
echo "  Toolverse Download Server Deployment (Azure) "
echo "============================================="

# 1. Domain configuration
if [ -z "$1" ]; then
  read -p "Enter your Azure VM DNS or custom domain (e.g. toolverse-backend.eastus.cloudapp.azure.com): " DOMAIN
else
  DOMAIN="$1"
fi

if [ -z "$DOMAIN" ]; then
  echo "Error: A domain or Azure DNS name is required for automatic HTTPS."
  exit 1
fi

echo "Deploying for domain: $DOMAIN"

# 2. Install Docker & Docker Compose if not present
if ! command -v docker &> /dev/null; then
  echo "--> Installing Docker..."
  sudo apt-get update
  sudo apt-get install -y curl ca-certificates git
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

# Ensure docker compose plugin is available
if ! docker compose version &> /dev/null; then
  echo "--> Installing Docker Compose plugin..."
  sudo apt-get update
  sudo apt-get install -y docker-compose-plugin
fi

# 3. Create .env if not exists
cat <<EOF > .env
DOMAIN=$DOMAIN
CORS_ORIGIN=*
API_KEY=
ACME_EMAIL=admin@toolversee.com
EOF

echo "--> Configuration written to .env"

# 4. Start containers
echo "--> Building and starting Docker containers..."
sudo docker compose -f docker-compose.azure.yml up -d --build

# 5. Wait and test
echo "--> Waiting for services to come up..."
sleep 5

echo "--> Verifying local backend health:"
sudo docker exec toolverse-yt-backend curl -s http://localhost:3000/health || true
echo ""

echo "============================================="
echo " Deployment Complete!"
echo " Public endpoint: https://$DOMAIN"
echo " Health check:    https://$DOMAIN/health"
echo "============================================="
