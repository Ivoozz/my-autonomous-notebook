#!/bin/bash

# Notebook One-Stop Installer for Debian LXC
# Sets up Backend, Frontend (Nginx), and Systemd Auto-start

set -e

echo "--- Notebook Installation Started [v1.1.2] ---"

# 1. Update and Install Dependencies
echo "Installing system dependencies..."
apt-get update
apt-get install -y nginx nodejs npm curl git

# 2. Repository Setup
# We use a fixed path for the autostart service to work reliably
INSTALL_DIR="/opt/notebook"
REPO_URL="https://github.com/Ivoozz/my-autonomous-notebook.git"

if [ ! -d "$INSTALL_DIR" ]; then
    echo "Cloning repository to $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
else
    echo "Directory $INSTALL_DIR already exists. Forcing update to latest version..."
    cd "$INSTALL_DIR"
    git fetch origin
    git reset --hard origin/main
fi

cd "$INSTALL_DIR"

# 3. Setup Backend
echo "Setting up backend..."
cd "$INSTALL_DIR/backend"
npm install

# 4. Create Systemd Service for Auto-start
echo "Configuring Systemd service..."
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

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable notebook-backend.service
systemctl restart notebook-backend.service

# 5. Setup Frontend
echo "Building frontend..."
cd "$INSTALL_DIR/frontend"
npm install
# Ensure API_URL is relative
sed -i "s|const API_URL = .*|const API_URL = '/api'|g" src/App.jsx
npm run build

# 6. Configure Nginx
echo "Configuring Nginx..."
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

# Adjust permissions
chmod -R 755 "$INSTALL_DIR"

# 7. Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx || service nginx restart || true

echo ""
echo "--- Installation Complete! ---"
echo "Access your notebook at: http://$(hostname -I | awk '{print $1}')"
echo "Default Password: password123"
echo "Autostart service 'notebook-backend' is active and enabled."
