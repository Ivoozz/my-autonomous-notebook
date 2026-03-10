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
INSTALL_DIR="/opt/notebook"
REPO_URL="https://github.com/Ivoozz/my-autonomous-notebook.git"

if [ ! -d "$INSTALL_DIR" ]; then
    echo "Cloning repository to $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
else
    echo "Directory $INSTALL_DIR already exists. Pulling latest changes..."
    cd "$INSTALL_DIR"
    git pull || echo "Not a git repository or pull failed, proceeding with existing files."
fi

cd "$INSTALL_DIR"

# 3. Security Setup (Application Level)
echo ""
echo "--- Security Setup ---"
echo "The app now uses a built-in login page."
echo "Default password is set to 'password123'."
echo "To change it, edit $INSTALL_DIR/backend/index.js"

# 4. Setup Backend
echo "Setting up backend..."
if [ -d "backend" ]; then
    cd backend
    npm install
    pkill -f "node index.js" || true
    nohup node index.js > backend.log 2>&1 &
    echo "Backend started in background (PID: $!)"
    cd ..
else
    echo "Error: backend directory not found in $(pwd)"
    exit 1
fi

# 5. Setup Frontend
echo "Building frontend..."
if [ -d "frontend" ]; then
    cd frontend
    npm install
    npm run build
    cd ..
else
    echo "Error: frontend directory not found in $(pwd)"
    exit 1
fi

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
systemctl restart nginx || service nginx restart || true

echo ""
echo "--- Installation Complete! ---"
echo "Access your notebook at: http://$(hostname -I | awk '{print $1}')"
echo "Default Password: password123"
