import os

path = '/root/my-autonomous-app/frontend/src/components/Sidebar.jsx'
with open(path, 'r') as f:
    content = f.read()

# Fix the Settings button icon
content = content.replace('icon={faPalette, faEnvelope}', 'icon={faPalette}')

with open(path, 'w') as f:
    f.write(content)
