import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

const Auth = ({ password, setPassword, handleLogin, loginError }) => {
  return (
    <div className="login-container">
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="login-card">
        <div style={{marginBottom:'1.5rem', color:'var(--accent-color)'}}>
          <FontAwesomeIcon icon={faLock} size="3x" />
        </div>
        <h1 style={{fontSize:'2.5rem', marginBottom:'0.5rem', fontWeight:900, letterSpacing:'-2px'}}>Notebook Pro</h1>
        <p style={{color:'var(--text-dim)', marginBottom:'2.5rem'}}>Securely enter your vault.</p>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            className="login-input" 
            placeholder="Vault Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            autoFocus 
          />
          {loginError && <div style={{color:'#ff4444', marginBottom:'1rem', fontWeight:'600'}}>{loginError}</div>}
          <button type="submit" className="login-btn">
            Unlock Vault
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;
