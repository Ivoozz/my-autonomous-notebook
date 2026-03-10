import os

path = '/root/my-autonomous-app/frontend/src/components/Settings.jsx'
with open(path, 'r') as f:
    content = f.read()

# Fix the imap_code position
# Remove the wrongly placed code if it's there
wrong_code = """
  const [imapSettings, setImapSettings] = useState({
    imapHost: '', imapPort: 993, imapUser: '', imapPass: '', imapTls: true
  });
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { 'Authorization': token } })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setImapSettings(data);
      });
  }, [token]);

  const saveImapSettings = async () => {
    setSaveStatus('Saving...');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(imapSettings)
    });
    if (res.ok) setSaveStatus('Settings saved!');
    else setSaveStatus('Failed to save settings');
    setTimeout(() => setSaveStatus(''), 3000);
  };
"""
content = content.replace(wrong_code, '')

# Re-add it correctly
imap_code = """
  const [imapSettings, setImapSettings] = useState({
    imapHost: '', imapPort: 993, imapUser: '', imapPass: '', imapTls: true
  });
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { 'Authorization': token } })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setImapSettings(data);
      });
  }, [token]);

  const saveImapSettings = async () => {
    setSaveStatus('Saving...');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(imapSettings)
    });
    if (res.ok) setSaveStatus('Settings saved!');
    else setSaveStatus('Failed to save settings');
    setTimeout(() => setSaveStatus(''), 3000);
  };
"""

# Insert inside component
insertion_point = 'handleImportAll, notebookTitle, setNotebookTitle, token }) => {'
content = content.replace(insertion_point, insertion_point + imap_code)

with open(path, 'w') as f:
    f.write(content)
