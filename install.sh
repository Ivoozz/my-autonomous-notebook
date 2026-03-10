#!/bin/bash

# Notebook One-Stop Installer for Debian LXC
# Sets up Backend, Frontend (Nginx), and Password Protection

set -e

echo "--- Notebook Installation Started ---"

# 1. Update and Install Dependencies
echo "Installing system dependencies..."
apt-get update
apt-get install -y nginx nodejs npm apache2-utils curl git

# 2. Repository Setup
INSTALL_DIR="/opt/notebook"
REPO_URL="https://github.com/Ivoozz/my-autonomous-notebook.git"

if [ ! -d "$INSTALL_DIR" ]; then
    echo "Cloning repository to $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# 3. Interactive User Creation for Password Protection
echo ""
echo "--- Security Setup ---"
if [ ! -f /etc/nginx/.htpasswd ]; then
    read -p "Enter username for site access: " NOTEBOOK_USER
    htpasswd -c /etc/nginx/.htpasswd "$NOTEBOOK_USER"
else
    echo "Nginx password file already exists. Skipping user creation."
    NOTEBOOK_USER=$(awk -F: '{print $1}' /etc/nginx/.htpasswd | head -n 1)
fi

# 4. Setup Backend
echo "Setting up backend..."
cd backend
npm install
# Simple systemd service for backend (optional, running in background for now)
# We use pkill to stop any existing instance before restarting
pkill -f "node index.js" || true
nohup node index.js > backend.log 2>&1 &
echo "Backend started in background (PID: $!)"
cd ..

# 5. Setup Frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 6. Configure Nginx
echo "Configuring Nginx..."
cat <<EOF > /etc/nginx/sites-available/notebook
server {
    listen 80;
    server_name _;

    root $INSTALL_DIR/frontend/dist;
    index index.html;

    # Password Protection
    auth_basic "Restricted Notebook Access";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
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

# Adjust permissions for Nginx
chmod -R 755 "$INSTALL_DIR"

# 7. Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx || service nginx restart

echo ""
echo "--- Installation Complete! ---"
echo "Access your notebook at: http://$(hostname -I | awk '{print $1}')"
echo "Login with user: $NOTEBOOK_USER"
