import React from 'react';
import { motion } from 'framer-motion';

const Auth = ({ password, setPassword, handleLogin, loginError }) => {
  return (
    <div className="login-container">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="login-card">
        <h1 style={{fontSize:'2.5rem', marginBottom:'1rem', fontWeight:900, letterSpacing:'-2px'}}>Notebook Pro</h1>
        <p style={{color:'var(--text-dim)', marginBottom:'2rem'}}>Unlock your private digital garden.</p>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            className="login-input" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            autoFocus 
          />
          {loginError && <div style={{color:'#ff4444', marginBottom:'1rem'}}>{loginError}</div>}
          <button type="submit" className="login-btn">Sign In</button>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;
