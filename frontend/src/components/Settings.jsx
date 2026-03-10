import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faArrowRightFromBracket, faEye, faEyeSlash, faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';

const Settings = ({ theme, setTheme, accentColor, setAccentColor, handleLogout, bgBlobs, setBgBlobs, handleExportAll, handleImportAll }) => {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="settings-container">
      <div className="settings-card">
        <h1 style={{marginBottom:'2rem', letterSpacing:'-1px'}}>Style & Account</h1>
        
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
