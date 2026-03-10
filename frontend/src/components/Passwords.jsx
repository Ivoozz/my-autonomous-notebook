import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faEye, faEyeSlash, faCopy, faLock } from '@fortawesome/free-solid-svg-icons';
import CryptoJS from 'crypto-js';

const Passwords = ({ token, masterPassword }) => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const API_URL = '/api';

  const fetchPasswords = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/passwords`, { headers: { 'Authorization': token } });
      if (res.ok) {
        const data = await res.json();
        // Decrypt data on fetch
        const decryptedData = data.map(item => {
          try {
            const bytes = CryptoJS.AES.decrypt(item.encryptedData, masterPassword);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedString) throw new Error('Decryption failed');
            return { ...item, password: decryptedString };
          } catch {
            return { ...item, password: '⚠️ Decryption Error (Wrong Master Password?)' };
          }
        });
        setPasswords(decryptedData);
      }
    } catch (err) {
      console.error('Failed to fetch passwords', err);
    } finally {
      setLoading(false);
    }
  }, [token, masterPassword]);

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  const handleAddPassword = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPasswordValue.trim()) return;

    try {
      // Encrypt the password before sending to the server
      const encryptedData = CryptoJS.AES.encrypt(newPasswordValue, masterPassword).toString();

      const res = await fetch(`${API_URL}/passwords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ title: newTitle, username: newUsername, encryptedData })
      });

      if (res.ok) {
        const data = await res.json();
        setPasswords([...passwords, { ...data, password: newPasswordValue }]);
        setNewTitle('');
        setNewUsername('');
        setNewPasswordValue('');
        setShowAddForm(false);
      }
    } catch {
      alert('Failed to save password.');
    }
  };

  const handleDeletePassword = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const res = await fetch(`${API_URL}/passwords/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        setPasswords(passwords.filter(p => p.id !== id));
      }
    } catch {
      alert('Failed to delete.');
    }
  };

  const toggleVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) return <div style={{padding:'3rem', textAlign:'center'}}>Loading Vault...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-container">
      <div className="settings-card" style={{width: '100%', maxWidth: '1000px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '2rem'}}>
          <h2 style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <FontAwesomeIcon icon={faLock} color="var(--accent-color)" /> Password Vault
          </h2>
          <button className="login-btn" style={{width: 'auto', height: '42px', padding: '0 1.2rem'}} onClick={() => setShowAddForm(!showAddForm)}>
            <FontAwesomeIcon icon={faPlus} style={{marginRight: '8px'}} /> Add Entry
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.form 
              initial={{ height: 0, opacity: 0, overflow: 'hidden' }} 
              animate={{ height: 'auto', opacity: 1, overflow: 'visible' }} 
              exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
              onSubmit={handleAddPassword}
              style={{display:'flex', flexDirection:'column', gap:'15px', marginBottom:'2rem', padding:'1.5rem', background:'rgba(0,0,0,0.2)', borderRadius:'var(--radius-md)', border:'1px solid var(--glass-border)'}}
            >
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px'}}>
                <input className="standard-input" placeholder="Title (e.g. Google)" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                <input className="standard-input" placeholder="Username / Email" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                <input className="standard-input" type="password" placeholder="Password" value={newPasswordValue} onChange={e => setNewPasswordValue(e.target.value)} required />
              </div>
              <button type="submit" className="login-btn" style={{alignSelf:'flex-end', width:'auto', height:'42px', padding:'0 2rem'}}>Save Securely</button>
            </motion.form>
          )}
        </AnimatePresence>

        <div style={{display:'grid', gap:'15px'}}>
          {passwords.map(p => (
            <motion.div layout key={p.id} className="glass-panel" style={{padding:'1.5rem', borderRadius:'var(--radius-md)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'15px'}}>
              <div style={{flex: 1, minWidth: '200px'}}>
                <div style={{fontSize:'1.1rem', fontWeight:800, marginBottom:'5px'}}>{p.title}</div>
                {p.username && <div style={{fontSize:'0.85rem', color:'var(--text-dim)'}}>{p.username}</div>}
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px', background:'rgba(255,255,255,0.05)', padding:'0.5rem 1rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', minWidth: '250px'}}>
                <div style={{flex:1, fontFamily:'monospace', letterSpacing: visiblePasswords[p.id] ? 'normal' : '3px'}}>
                  {visiblePasswords[p.id] ? p.password : '••••••••••••'}
                </div>
                <button className="btn-icon" style={{width:32, height:32}} onClick={() => toggleVisibility(p.id)} title="Toggle Visibility">
                  <FontAwesomeIcon icon={visiblePasswords[p.id] ? faEyeSlash : faEye} size="sm" />
                </button>
                <button className="btn-icon" style={{width:32, height:32}} onClick={() => copyToClipboard(p.password)} title="Copy Password">
                  <FontAwesomeIcon icon={faCopy} size="sm" />
                </button>
              </div>
              <button className="btn-icon" style={{width:40, height:40}} onClick={() => handleDeletePassword(p.id)} title="Delete">
                <FontAwesomeIcon icon={faTrashCan} color="#ff4444" />
              </button>
            </motion.div>
          ))}
          {passwords.length === 0 && !loading && (
            <div style={{textAlign:'center', padding:'3rem', opacity:0.5}}>No passwords stored. Your vault is empty.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Passwords;