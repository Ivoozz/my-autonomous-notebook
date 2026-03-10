#!/bin/bash

# Notebook Pro Setup Script [v1.2.0]
# Optimized for Debian LXC with Systemd Autostart and Nginx Proxy

set -e

echo "=========================================="
echo "   Notebook Pro Installation [v1.2.0]"
echo "=========================================="

# 1. System Dependencies
echo "[1/7] Installing system dependencies..."
apt-get update -qq
apt-get install -y nginx nodejs npm curl git -qq

# 2. Clean Environment Setup
INSTALL_DIR="/opt/notebook"
REPO_URL="https://github.com/Ivoozz/my-autonomous-notebook.git"

echo "[2/7] Setting up repository in $INSTALL_DIR..."
if [ -d "$INSTALL_DIR" ]; then
    echo "Updating existing installation..."
    cd "$INSTALL_DIR"
    git fetch origin
    git reset --hard origin/main
else
    echo "Performing fresh clone..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 3. Backend Configuration
echo "[3/7] Configuring backend..."
cd "$INSTALL_DIR/backend"
npm install --silent

# Ensure the backend uses the correct port and settings
# No changes needed to index.js as it defaults to 5000

# 4. Systemd Service (Autostart)
echo "[4/7] Creating autostart service..."
cat <<EOF > /etc/systemd/system/notebook-backend.service
[Unit]
Description=Notebook Backend Service
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

# 5. Frontend Build
echo "[5/7] Building frontend..."
cd "$INSTALL_DIR/frontend"
npm install --silent

# Force the API URL to be relative for Nginx
sed -i "s|const API_URL = .*|const API_URL = '/api'|g" src/App.jsx

npm run build

# 6. Nginx Configuration
echo "[6/7] Configuring Nginx proxy..."
cat <<EOF > /etc/nginx/sites-available/notebook
server {
    listen 80;
    server_name _;

    root $INSTALL_DIR/frontend/dist;
    index index.html;

    # Frontend
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Enable site and remove default
ln -sf /etc/nginx/sites-available/notebook /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Permissions
chmod -R 755 "$INSTALL_DIR"

# 7. Finalize
echo "[7/7] Restarting services..."
systemctl restart nginx

echo "=========================================="
echo "   Installation Successful!"
echo "=========================================="
echo "URL: http://$(hostname -I | awk '{print $1}')"
echo "Default Password: password123"
echo "Service status: $(systemctl is-active notebook-backend.service)"
echo "=========================================="
