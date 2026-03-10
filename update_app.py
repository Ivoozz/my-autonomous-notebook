import os

path = '/root/my-autonomous-app/frontend/src/App.jsx'
with open(path, 'r') as f:
    content = f.read()

# Add Imports
if "import Emails" not in content:
    content = content.replace("import Auth from './components/Auth'", "import Auth from './components/Auth'\nimport Emails from './components/Emails'")

if 'faEnvelope' not in content:
    content = content.replace('faPalette', 'faPalette, faEnvelope')

# Add notebookTitle State
if 'const [notebookTitle' not in content:
    content = content.replace("const [activeTab, setActiveTab] = useState('notes')", "const [activeTab, setActiveTab] = useState('notes')\n  const [notebookTitle, setNotebookTitle] = useState(localStorage.getItem('notebookTitle') || 'Notebook')")

# Update useEffect to save notebookTitle
if "localStorage.setItem('notebookTitle', notebookTitle)" not in content:
    content = content.replace("localStorage.setItem('notebook_blobs', bgBlobs)", "localStorage.setItem('notebook_blobs', bgBlobs)\n    localStorage.setItem('notebookTitle', notebookTitle)")

# Update Sidebar props
content = content.replace('<Sidebar ', '<Sidebar \n        notebookTitle={notebookTitle} ')

# Update Settings props
content = content.replace('<Settings ', '<Settings \n              notebookTitle={notebookTitle} setNotebookTitle={setNotebookTitle} token={token} ')

# Add Emails to mobile-nav
if 'activeTab === \'emails\'' not in content:
    nav_item_emails = """        <button className={`nav-item ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')}>
          <FontAwesomeIcon icon={faEnvelope} style={{fontSize:'1.4rem'}} />
          <span>Inbox</span>
        </button>"""
    content = content.replace('<nav className="mobile-nav">', '<nav className="mobile-nav">\n' + nav_item_emails)

# Add Emails view to main-content
if 'activeTab === \'emails\'' not in content:
    emails_view = """          {activeTab === 'emails' && (
            <Emails token={token} handleAddTodo={(newTaskObj) => {
                fetch(`${API_URL}/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(newTaskObj) }).then(() => fetchTodos())
              }} 
            />
          )}"""
    content = content.replace("{activeTab === 'settings' && (", emails_view + "\n          {activeTab === 'settings' && (")

with open(path, 'w') as f:
    f.write(content)
