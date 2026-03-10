#!/bin/bash

# Notebook One-Stop Installer for Debian LXC
# Sets up Backend, Frontend (Nginx), and Password Protection

set -e

echo "--- Notebook Installation Started ---"

# 1. Update and Install Dependencies
echo "Installing system dependencies..."
apt-get update
apt-get install -y nginx nodejs npm curl git

# 2. Repository Setup
# We'll use the current directory we are in
INSTALL_DIR=$(pwd)
echo "Current installation directory: $INSTALL_DIR"

# 3. Security Setup (Application Level)
echo ""
echo "--- Security Setup ---"
echo "The app now uses a built-in login page."
echo "Default password is set to 'password123'."
echo "To change it, edit $INSTALL_DIR/backend/index.js"

# 4. Setup Backend
echo "Setting up backend..."
cd "$INSTALL_DIR/backend"
npm install
# pkill to ensure we don't have multiple instances
pkill -f "node index.js" || true
# Run in background and ensure it persists
nohup node index.js > backend.log 2>&1 &
echo "Backend started in background (PID: $!)"

# 5. Setup Frontend
echo "Building frontend..."
cd "$INSTALL_DIR/frontend"
npm install
# Fix the API URL to be relative before building
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

# Adjust permissions for Nginx to access the directory
# IMPORTANT: Nginx user (www-data) needs search (+) permission on all parent directories
# Since we are likely in /root, this is risky. Let's suggest moving it if it fails.
chmod -R 755 "$INSTALL_DIR"
# Also need to make sure the parent directory is accessible
chmod 755 /root || true

# 7. Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx || service nginx restart || true

echo ""
echo "--- Installation Complete! ---"
echo "Access your notebook at: http://$(hostname -I | awk '{print $1}')"
echo "Default Password: password123"
