import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPlus, faSync, faReply, faNoteSticky, faPaperPlane, faTimes } from '@fortawesome/free-solid-svg-icons';

const Emails = ({ token, handleAddTodo, onCreateNote }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSaving] = useState(false);

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

  const exportToNote = async (email) => {
    const newNote = {
      title: `Email: ${email.subject || '(No Subject)'}`,
      content: `# ${email.subject || '(No Subject)'}\n\n**From:** ${email.from}\n**Date:** ${new Date(email.date).toLocaleString()}\n\n---\n\n${email.body || email.snippet}`,
      category: 'Inbox'
    };
    
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(newNote)
      });
      if (res.ok) {
        alert('Note created from email!');
      }
    } catch (err) {
      alert('Failed to create note');
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({
          to: replyingTo.from,
          subject: replyingTo.subject.startsWith('Re:') ? replyingTo.subject : `Re: ${replyingTo.subject}`,
          text: replyText,
          inReplyTo: replyingTo.messageId,
          references: replyingTo.messageId
        })
      });
      if (res.ok) {
        alert('Reply sent!');
        setReplyingTo(null);
        setReplyText('');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
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
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {emails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)' }}>No emails found or IMAP not configured in Settings.</div>
          ) : (
            emails.map((email, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                      <FontAwesomeIcon icon={faEnvelope} style={{ color: 'var(--accent-color)' }} />
                      <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{email.subject || '(No Subject)'}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>From: {email.from}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{new Date(email.date).toLocaleDateString()}</div>
                </div>
                
                <div style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.6, background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  {email.snippet}...
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className="login-btn" style={{ width: 'auto', height: '42px', padding: '0 1.2rem', fontSize: '0.85rem' }} onClick={() => setReplyingTo(email)}>
                    <FontAwesomeIcon icon={faReply} style={{ marginRight: '8px' }} /> Reply
                  </button>
                  <button className="login-btn" style={{ width: 'auto', height: '42px', padding: '0 1.2rem', fontSize: '0.85rem', background: 'var(--glass-highlight)', color: 'var(--text-color)', border: '1px solid var(--glass-border)' }} onClick={() => exportToTask(email)}>
                    <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} /> Task
                  </button>
                  <button className="login-btn" style={{ width: 'auto', height: '42px', padding: '0 1.2rem', fontSize: '0.85rem', background: 'var(--glass-highlight)', color: 'var(--text-color)', border: '1px solid var(--glass-border)' }} onClick={() => exportToNote(email)}>
                    <FontAwesomeIcon icon={faNoteSticky} style={{ marginRight: '8px' }} /> Note
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      <AnimatePresence>
        {replyingTo && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
              <button onClick={() => setReplyingTo(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-color)', cursor: 'pointer', fontSize: '1.2rem' }}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <h2 style={{ marginBottom: '1.5rem' }}>Reply to {replyingTo.from}</h2>
              <div style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>Subject: Re: {replyingTo.subject}</div>
              <textarea 
                className="markdown-editor" 
                style={{ width: '100%', height: '200px', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--glass-border)' }}
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <button className="login-btn" onClick={handleSendReply} disabled={isSending}>
                <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: '10px' }} />
                {isSending ? 'Sending...' : 'Send Reply'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Emails;