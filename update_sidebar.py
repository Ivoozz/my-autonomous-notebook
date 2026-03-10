import os

path = '/root/my-autonomous-app/frontend/src/components/Sidebar.jsx'
with open(path, 'r') as f:
    content = f.read()

# Add faEnvelope import
if 'faEnvelope' not in content:
    content = content.replace('faPalette', 'faPalette, faEnvelope')

# Update prop destructuring
if 'notebookTitle' not in content:
    content = content.replace('notes, activeNoteId, searchQuery', 'notes, activeNoteId, notebookTitle, searchQuery')

# Use notebookTitle in <h2>
content = content.replace('<h2>Notebook</h2>', '<h2>{notebookTitle}</h2>')

# Add Emails tab button
if 'setActiveTab(\'emails\')' not in content:
    emails_tab_btn = """        <button className={`btn-icon ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')} title="Emails">
          <FontAwesomeIcon icon={faEnvelope} />
        </button>"""
    content = content.replace('setActiveTab(\'settings\')', 'setActiveTab(\'emails\')\' title=\"Emails\">\n          <FontAwesomeIcon icon={faEnvelope} />\n        </button>\n        <button className={`btn-icon ${activeTab === \'settings\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'settings\')}')
    # Wait, my search-replace was a bit complex. Let's simplify.
    # Re-read content
    with open(path, 'r') as f:
        content = f.read()
    
    # Add prop
    content = content.replace('notes, activeNoteId, searchQuery', 'notes, activeNoteId, notebookTitle, searchQuery')
    # Add faEnvelope
    content = content.replace('faPalette', 'faPalette, faEnvelope')
    # Replace h2
    content = content.replace('<h2>Notebook</h2>', '<h2>{notebookTitle}</h2>')
    # Add button
    btn_marker = 'onClick={() => setActiveTab(\'settings\')} title=\"Settings\">'
    new_btn = 'onClick={() => setActiveTab(\'emails\')} title=\"Emails\">\n          <FontAwesomeIcon icon={faEnvelope} />\n        </button>\n        <button className={`btn-icon ${activeTab === \'settings\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'settings\')} title=\"Settings\">'
    content = content.replace(btn_marker, new_btn)

with open(path, 'w') as f:
    f.write(content)
