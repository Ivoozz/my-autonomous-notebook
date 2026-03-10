import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faArrowRightFromBracket, faEye, faEyeSlash, faDownload, faUpload, faServer, faEnvelope, faKey, faUser, faSave } from '@fortawesome/free-solid-svg-icons';

const Settings = ({ theme, setTheme, accentColor, setAccentColor, handleLogout, bgBlobs, setBgBlobs, handleExportAll, handleImportAll, notebookTitle, setNotebookTitle, token }) => {
  const [adminSettings, setAdminSettings] = useState({
    imapHost: '', imapPort: 993, imapUser: '', imapPass: '', imapTls: true,
    smtpHost: '', smtpPort: 465, smtpUser: '', smtpPass: '', smtpTls: true
  });
  const [saveStatus, setSaveStatus] = useState('');
  
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [pwdStatus, setPwdStatus] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { 'Authorization': token } })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setAdminSettings(prev => ({...prev, ...data}));
      });
  }, [token]);

  const handleSaveSettings = async () => {
    setSaveStatus('Saving...');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify(adminSettings)
    });
    if (res.ok) setSaveStatus('Settings saved!');
    else setSaveStatus('Failed to save settings');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleChangePassword = async () => {
    if (!passwords.old || !passwords.new) return setPwdStatus('Please fill all fields');
    if (passwords.new !== passwords.confirm) return setPwdStatus('New passwords do not match');
    if (passwords.new.length < 6) return setPwdStatus('New password must be at least 6 characters');

    setPwdStatus('Updating...');
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ oldPassword: passwords.old, newPassword: passwords.new })
      });
      const data = await res.json();
      if (res.ok) {
        setPwdStatus('Password changed successfully! Please log in again.');
        setTimeout(() => handleLogout(), 2000);
      } else {
        setPwdStatus(data.error || 'Failed to change password');
      }
    } catch (err) {
      setPwdStatus('Error updating password');
    }
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

        <h2 style={{marginBottom:'1rem', marginTop:'1rem', fontSize:'1.2rem', letterSpacing:'-0.5px'}}>Email Server Settings (IMAP/SMTP)</h2>
        
        <div style={{display:'grid', gap:'15px', marginBottom:'1.5rem', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))'}}>
          <div className="glass-panel" style={{padding:'1rem', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity:0.7}}><FontAwesomeIcon icon={faServer} /> IMAP Host</div>
            <input className="search-input" value={adminSettings.imapHost} onChange={e => setAdminSettings({...adminSettings, imapHost: e.target.value})} placeholder="imap.gmail.com" />
          </div>
          <div className="glass-panel" style={{padding:'1rem', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity:0.7}}><FontAwesomeIcon icon={faServer} /> IMAP Port</div>
            <input className="search-input" type="number" value={adminSettings.imapPort} onChange={e => setAdminSettings({...adminSettings, imapPort: parseInt(e.target.value)})} placeholder="993" />
          </div>
          <div className="glass-panel" style={{padding:'1rem', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity:0.7}}><FontAwesomeIcon icon={faServer} /> SMTP Host</div>
            <input className="search-input" value={adminSettings.smtpHost} onChange={e => setAdminSettings({...adminSettings, smtpHost: e.target.value})} placeholder="smtp.gmail.com" />
          </div>
          <div className="glass-panel" style={{padding:'1rem', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity:0.7}}><FontAwesomeIcon icon={faServer} /> SMTP Port</div>
            <input className="search-input" type="number" value={adminSettings.smtpPort} onChange={e => setAdminSettings({...adminSettings, smtpPort: parseInt(e.target.value)})} placeholder="465" />
          </div>
          <div className="glass-panel" style={{padding:'1rem', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity:0.7}}><FontAwesomeIcon icon={faUser} /> Email Username</div>
            <input className="search-input" value={adminSettings.imapUser} onChange={e => setAdminSettings({...adminSettings, imapUser: e.target.value, smtpUser: e.target.value})} placeholder="user@example.com" />
          </div>
          <div className="glass-panel" style={{padding:'1rem', borderRadius:'var(--radius-md)'}}>
            <div style={{fontSize:'0.8rem', marginBottom:'5px', opacity:0.7}}><FontAwesomeIcon icon={faKey} /> Email Password</div>
            <input className="search-input" type="password" value={adminSettings.imapPass} onChange={e => setAdminSettings({...adminSettings, imapPass: e.target.value, smtpPass: e.target.value})} placeholder="••••••••" />
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:'20px', marginBottom:'2rem', flexWrap:'wrap'}}>
           <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
             <input type="checkbox" checked={adminSettings.imapTls} onChange={e => setAdminSettings({...adminSettings, imapTls: e.target.checked})} />
             <span>IMAP TLS</span>
           </label>
           <label style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
             <input type="checkbox" checked={adminSettings.smtpTls} onChange={e => setAdminSettings({...adminSettings, smtpTls: e.target.checked})} />
             <span>SMTP TLS</span>
           </label>
           <button className="login-btn" style={{width:'auto', padding:'0.8rem 2rem'}} onClick={handleSaveSettings}>
             <FontAwesomeIcon icon={faSave} style={{marginRight:'8px'}} /> Save Settings
           </button>
           {saveStatus && <span style={{fontSize:'0.9rem', color: saveStatus.includes('Failed') ? '#ff4444' : 'var(--accent-color)'}}>{saveStatus}</span>}
        </div>

        <h2 style={{marginBottom:'1rem', marginTop:'1rem', fontSize:'1.2rem', letterSpacing:'-0.5px'}}>Security & Vault Password</h2>
        <div className="glass-panel" style={{padding:'2rem', borderRadius:'var(--radius-md)', marginBottom:'2rem', border:'1px solid rgba(255, 68, 68, 0.2)'}}>
          <p style={{fontSize:'0.9rem', color:'#ff4444', marginBottom:'1.5rem', fontWeight:600}}>
            <FontAwesomeIcon icon={faLock} style={{marginRight:'8px'}} /> 
            Warning: Changing your vault password will make existing entries in your Password Vault unreadable, as they are encrypted with your current password.
          </p>
          <div style={{display:'grid', gap:'15px', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', marginBottom:'1.5rem'}}>
            <input 
              type="password" 
              className="search-input" 
              placeholder="Current Vault Password" 
              value={passwords.old} 
              onChange={e => setPasswords({...passwords, old: e.target.value})} 
            />
            <input 
              type="password" 
              className="search-input" 
              placeholder="New Vault Password" 
              value={passwords.new} 
              onChange={e => setPasswords({...passwords, new: e.target.value})} 
            />
            <input 
              type="password" 
              className="search-input" 
              placeholder="Confirm New Password" 
              value={passwords.confirm} 
              onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
            />
          </div>
          <button 
            className="login-btn" 
            style={{width:'auto', padding:'0.8rem 2rem', background:'rgba(255, 68, 68, 0.1)', color:'#ff4444', border:'1px solid rgba(255, 68, 68, 0.3)'}}
            onClick={handleChangePassword}
          >
            Update Vault Password
          </button>
          {pwdStatus && <p style={{marginTop:'1rem', fontSize:'0.9rem', color: pwdStatus.includes('successfully') ? 'var(--accent-color)' : '#ff4444'}}>{pwdStatus}</p>}
        </div>

        <h2 style={{marginBottom:'1rem', marginTop:'1rem', fontSize:'1.2rem', letterSpacing:'-0.5px'}}>Data & Backup</h2>
        <div style={{display:'flex', gap:'15px', marginBottom:'2rem', flexWrap:'wrap'}}>
          <button className="login-btn" style={{flex:1, background:'var(--glass-bg)', color:'var(--text-color)', border:'1px solid var(--glass-border)'}} onClick={handleExportAll}>
            <FontAwesomeIcon icon={faDownload} style={{marginRight:'8px'}}/> Export Backup
          </button>
          <label className="login-btn" style={{flex:1, background:'var(--glass-bg)', color:'var(--text-color)', border:'1px solid var(--glass-border)', cursor:'pointer'}}>
            <FontAwesomeIcon icon={faUpload} style={{marginRight:'8px'}}/> Import Backup
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