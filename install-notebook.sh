#!/bin/bash

# Notebook Ultimate Installer [v1.4.1]
# Optimized for Debian LXC, Nginx Proxy, and Systemd Autostart

set -e

# Clear screen for professional look
clear
echo "===================================================="
echo "   Notebook Pro - Ultimate Installation [v1.4.1]"
echo "===================================================="

# 1. System Check & Dependencies
echo "[1/6] Installing system requirements..."
apt-get update -qq
apt-get install -y nginx nodejs npm curl git -qq

# 2. Environment Setup
INSTALL_DIR="/opt/notebook"
REPO_URL="https://github.com/Ivoozz/my-autonomous-notebook.git"

echo "[2/6] Syncing code to $INSTALL_DIR..."
if [ -d "$INSTALL_DIR" ]; then
    cd "$INSTALL_DIR"
    git fetch --all
    git reset --hard origin/main
else
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 3. Backend & Autostart
echo "[3/6] Setting up backend and autostart..."
cd "$INSTALL_DIR/backend"
npm install --silent

cat <<EOF > /etc/systemd/system/notebook-backend.service
[Unit]
Description=Notebook Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=/usr/bin/node index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable notebook-backend.service
systemctl restart notebook-backend.service

# 4. Frontend Build
echo "[4/6] Building high-end frontend..."
cd "$INSTALL_DIR/frontend"
npm install --silent
# Force relative API for proxying
sed -i "s|const API_URL = .*|const API_URL = '/api'|g" src/App.jsx
npm run build --silent

# 5. Nginx Configuration
echo "[5/6] Finalizing Nginx proxy..."
cat <<EOF > /etc/nginx/sites-available/notebook
server {
    listen 80;
    server_name _;
    root $INSTALL_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/notebook /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
chmod -R 755 "$INSTALL_DIR"
chmod 755 /root || true

# 6. Success
systemctl restart nginx
echo "===================================================="
echo "   🎉 Installation Successful!"
echo "===================================================="
echo "   URL: http://$(hostname -I | awk '{print $1}')"
echo "   Default Password: password123"
echo "===================================================="
