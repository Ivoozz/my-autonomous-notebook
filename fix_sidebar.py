import os

path = '/root/my-autonomous-app/frontend/src/components/Sidebar.jsx'
with open(path, 'r') as f:
    content = f.read()

# Fix the Emails button active condition
old_btn_logic = "className={`btn-icon ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('emails')}"
new_btn_logic = "className={`btn-icon ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')}"
content = content.replace(old_btn_logic, new_btn_logic)

with open(path, 'w') as f:
    f.write(content)
