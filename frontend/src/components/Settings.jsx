import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faArrowRightFromBracket, faEye, faEyeSlash, faDownload, faUpload, faServer, faEnvelope, faKey, faUser, faSave } from '@fortawesome/free-solid-svg-icons';


const Settings = ({ theme, setTheme, accentColor, setAccentColor, handleLogout, bgBlobs, setBgBlobs, handleExportAll, handleImportAll, notebookTitle, setNotebookTitle, token }) => {
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

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="settings-container">
      <div className="settings-card">
        <h1 style={{marginBottom:'2rem', letterSpacing:'-1px'}}>Settings & Account</h1>
        <div className="settings-row" style={{flexDirection:'column', alignItems:'flex-start', gap:'0.8rem', marginBottom:'1.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid var(--glass-border)'}}>
          <span>Notebook Display Name</span>
          <input 
            type="text" 
            className="search-input" 
            value={notebookTitle} 
            onChange={(e) => setNotebookTitle(e.target.value)} 
            placeholder="Notebook Name"
            style={{maxWidth:'400px'}}
          />
        </div>

        
        <div className="settings-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid var(--glass-border)'}}>
          <span>Theme Preference</span>
          <button className="btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
          </button>
        </div>

        <div className="settings-row" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid var(--glass-border)'}}>
          <span>Animated Background</span>
          <button className="btn-icon" onClick={() => setBgBlobs(!bgBlobs)}>
            <FontAwesomeIcon icon={bgBlobs ? faEye : faEyeSlash} />
          </button>
        </div>

        <div className="settings-row" style={{flexDirection:'column', alignItems:'flex-start', gap:'1.5rem', marginBottom:'2rem'}}>
          <span>System Accent Color</span>
          <div className="color-grid" style={{display:'flex', gap:'15px', flexWrap:'wrap'}}>
            {['#7c4dff', '#ff4081', '#00e676', '#ffea00', '#00b0ff', '#ffffff'].map(c => (
              <div key={c} className={`color-circle ${accentColor === c ? 'active' : ''}`} style={{background:c}} onClick={() => setAccentColor(c)} />
            ))}
          </div>
        </div>

        
        <h2 style={{marginBottom:'1rem', marginTop:'1rem', fontSize:'1.2rem', letterSpacing:'-0.5px'}}>Admin & Email Settings</h2>
        <div style={{display:'grid', gap:'15px', marginBottom:'2rem', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))'}}>
          <div className="glass-panel" style={{padding:'1rem', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity:0.7}}><FontAwesomeIcon icon={faServer} /> IMAP Host</div>
            <input className="search-input" value={imapSettings.imapHost} onChange={e => setImapSettings({...imapSettings, imapHost: e.target.value})} placeholder="imap.gmail.com" />
          </div>
          <div className="glass-panel" style={{padding:'1rem', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity:0.7}}><FontAwesomeIcon icon={faServer} /> Port</div>
            <input className="search-input" type="number" value={imapSettings.imapPort} onChange={e => setImapSettings({...imapSettings, imapPort: parseInt(e.target.value)})} placeholder="993" />
          </div>
          <div className="glass-panel" style={{padding:'1rem', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity:0.7}}><FontAwesomeIcon icon={faUser} /> Username</div>
            <input className="search-input" value={imapSettings.imapUser} onChange={e => setImapSettings({...imapSettings, imapUser: e.target.value})} placeholder="user@example.com" />
          </div>
          <div className="glass-panel" style={{padding:'1rem', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity:0.7}}><FontAwesomeIcon icon={faKey} /> Password</div>
            <input className="search-input" type="password" value={imapSettings.imapPass} onChange={e => setImapSettings({...imapSettings, imapPass: e.target.value})} placeholder="••••••••" />
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'2rem'}}>
           <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
             <input type="checkbox" checked={imapSettings.imapTls} onChange={e => setImapSettings({...imapSettings, imapTls: e.target.checked})} />
             <span>Use TLS</span>
           </label>
           <button className="login-btn" style={{width:'auto', padding:'0.8rem 2rem'}} onClick={saveImapSettings}>
             <FontAwesomeIcon icon={faSave} style={{marginRight:'8px'}} /> Save Admin Settings
           </button>
           {saveStatus && <span style={{fontSize:'0.9rem', color: saveStatus.includes('Failed') ? '#ff4444' : 'var(--accent-color)'}}>{saveStatus}</span>}
        </div>

<h2 style={{marginBottom:'1rem', marginTop:'1rem', fontSize:'1.2rem', letterSpacing:'-0.5px'}}>Data & Backup</h2>
        <div style={{display:'flex', gap:'15px', marginBottom:'2rem', flexWrap:'wrap'}}>
          <button className="login-btn" style={{flex:1, background:'var(--glass-bg)', color:'var(--text-color)', border:'1px solid var(--glass-border)'}} onClick={handleExportAll}>
            <FontAwesomeIcon icon={faDownload} style={{marginRight:'8px'}}/> Export Backup
          </button>
          <label className="login-btn" style={{flex:1, background:'var(--glass-bg)', color:'var(--text-color)', border:'1px solid var(--glass-border)', cursor:'pointer'}}>
            <FontAwesomeIcon icon={faUpload, faServer, faEnvelope, faKey, faUser, faSave} style={{marginRight:'8px'}}/> Import Backup
            <input type="file" accept=".json" style={{display:'none'}} onChange={handleImportAll} />
          </label>
        </div>

        <div style={{marginTop:'3rem', paddingTop:'2rem', borderTop:'1px solid var(--glass-border)'}}>
          <button className="login-btn" style={{background:'rgba(255,68,68,0.1)', color:'#ff4444', border:'1px solid rgba(255,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}} onClick={handleLogout}>
            <FontAwesomeIcon icon={faArrowRightFromBracket} /> Sign Out
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
