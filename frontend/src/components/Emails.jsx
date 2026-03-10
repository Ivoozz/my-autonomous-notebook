import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPlus, faSync } from '@fortawesome/free-solid-svg-icons';

const Emails = ({ token, handleAddTodo }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/emails', {
        headers: { 'Authorization': token }
      });
      if (!res.ok) throw new Error('Failed to fetch emails');
      const data = await res.json();
      setEmails(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const exportToTask = (email) => {
    const newTask = {
      task: `Email: ${email.subject || '(No Subject)'}`,
      description: `From: ${email.from}\n\nSnippet: ${email.snippet || ''}`,
      completed: false,
      priority: 'Medium'
    };
    handleAddTodo(newTask);
    alert('Task created from email!');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="view-container" style={{ padding: '2rem', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1.5px' }}>Inbox Integration</h1>
        <button className="btn-icon" onClick={fetchEmails} title="Refresh Emails"><FontAwesomeIcon icon={faSync} spin={loading} /></button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading your messages...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ff4444' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {emails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)' }}>No emails found or IMAP not configured.</div>
          ) : (
            emails.map((email, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}><FontAwesomeIcon icon={faEnvelope} style={{ color: 'var(--accent-color)' }} /><span style={{ fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.subject || '(No Subject)'}</span></div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>From: {email.from}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{email.snippet}</div>
                </div>
                <button className="login-btn" style={{ width: 'auto', padding: '0.8rem 1.2rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }} onClick={() => exportToTask(email)}><FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />Export to Task</button>
              </motion.div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Emails;