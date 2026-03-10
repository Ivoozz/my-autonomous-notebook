import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faPlus, faThumbtack, faFileLines, faCalendarDays, faSquareCheck, faPalette, faEnvelope, faXmark, faFilter, faPlay, faPause, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';

const extractTags = (text) => {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  return matches ? [...new Set(matches)] : [];
};

const Sidebar = ({ 
  notes, activeNoteId, notebookTitle, searchQuery, setSearchQuery, 
  onNoteClick, onCreateNote, activeTab, setActiveTab, 
  sidebarOpen, setSidebarOpen 
}) => {
  const [sortMode, setSortMode] = useState('Date'); // Date, Title, Category
  
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [pomoActive, setPomoActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (pomoActive && pomoTime > 0) {
      interval = setInterval(() => setPomoTime(t => t - 1), 1000);
    } else if (pomoTime === 0) {
      setPomoActive(false);
      alert('Pomodoro session complete!');
    }
    return () => clearInterval(interval);
  }, [pomoActive, pomoTime]);

  const toggleSort = () => {
    if (sortMode === 'Date') setSortMode('Title');
    else if (sortMode === 'Title') setSortMode('Category');
    else setSortMode('Date');
  };

  const filteredNotes = notes
    .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      
      if (sortMode === 'Title') return a.title.localeCompare(b.title);
      if (sortMode === 'Category') {
        const catA = a.category?.toLowerCase() || 'general';
        const catB = b.category?.toLowerCase() || 'general';
        if (catA !== catB) return catA.localeCompare(catB);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <aside className={`sidebar ${sidebarOpen ? 'mobile-visible' : ''}`}>
      <div className="sidebar-header">
        <h2>{notebookTitle}</h2>
        <button className="btn-icon mobile-only" onClick={() => setSidebarOpen(false)}>
          <FontAwesomeIcon icon={faXmark} size="lg" />
        </button>
      </div>

      <div style={{display:'flex', padding:'0 1.5rem 1rem', gap:'10px'}}>
        <button className={`btn-icon ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')} title="Notes">
          <FontAwesomeIcon icon={faFileLines} />
        </button>
        <button className={`btn-icon ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')} title="Calendar">
          <FontAwesomeIcon icon={faCalendarDays} />
        </button>
        <button className={`btn-icon ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')} title="Tasks">
          <FontAwesomeIcon icon={faSquareCheck} />
        </button>
        <button className={`btn-icon ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')} title="Emails">
          <FontAwesomeIcon icon={faEnvelope} />
        </button>
        <button className={`btn-icon ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} title="Settings">
          <FontAwesomeIcon icon={faPalette} />
        </button>
      </div>

      <div className="search-container">
        <div style={{display:'flex', gap:'10px'}}>
          <div style={{position:'relative', flex: 1}}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', opacity:0.5}} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search..." 
              style={{paddingLeft:'35px'}}
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <button 
            className="btn-icon" 
            onClick={toggleSort} 
            title={`Sort by: ${sortMode}`}
            style={{width: '42px', height: '42px', fontSize: '0.8rem', fontWeight: 'bold'}}
          >
            {sortMode.slice(0, 3)}
          </button>
        </div>
      </div>

      <div className="notes-list">
        <AnimatePresence mode="popLayout">
          {filteredNotes.map(n => (
            <motion.div 
              layout
              key={n.id} 
              className={`note-item ${activeNoteId === n.id ? 'active' : ''}`} 
              onClick={() => { onNoteClick(n); setSidebarOpen(false); }}
            >
              <div className="note-title-small">
                {n.isPinned && <FontAwesomeIcon icon={faThumbtack} style={{marginRight:'8px', color:'var(--accent-color)', fontSize:'0.8rem'}} />}
                {n.title || 'Untitled'}
              </div>
              <div style={{display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'8px'}}>
                {extractTags(n.content).slice(0, 3).map(tag => (
                  <span key={tag} style={{fontSize:'0.65rem', background:'var(--glass-highlight)', padding:'2px 6px', borderRadius:'10px', color:'var(--accent-color)'}}>{tag}</span>
                ))}
              </div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                <div className="note-meta">{format(parseISO(n.createdAt), 'MMM d')}</div>
                {n.category && (
                  <div className="note-category-tag">
                    {n.category}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="sidebar-footer" style={{display:'flex', flexDirection:'column', gap:'10px'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(0,0,0,0.1)', padding:'10px', borderRadius:'var(--radius-md)'}}>
          <span style={{fontWeight:'bold', fontFamily:'monospace', fontSize:'1.2rem', color:'var(--accent-color)'}}>
            {Math.floor(pomoTime / 60).toString().padStart(2, '0')}:{(pomoTime % 60).toString().padStart(2, '0')}
          </span>
          <div style={{display:'flex', gap:'5px'}}>
            <button className="btn-icon" style={{width:30, height:30}} onClick={() => setPomoActive(!pomoActive)}>
              <FontAwesomeIcon icon={pomoActive ? faPause : faPlay} size="sm" />
            </button>
            <button className="btn-icon" style={{width:30, height:30}} onClick={() => { setPomoActive(false); setPomoTime(25*60); }}>
              <FontAwesomeIcon icon={faRotateRight} size="sm" />
            </button>
          </div>
        </div>
        <button className="login-btn" style={{padding:'0.6rem'}} onClick={() => onCreateNote()}>
          <FontAwesomeIcon icon={faPlus} style={{marginRight:'8px'}} /> New Note
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
