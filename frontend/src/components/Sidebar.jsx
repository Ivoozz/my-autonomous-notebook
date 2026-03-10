import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faPlus, faThumbtack, faFileLines, faCalendarDays, faSquareCheck, faPalette, faEnvelope, faXmark, faFilter, faFolder, faCircleQuestion, faLock } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';

const extractTags = (text) => {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  return matches ? [...new Set(matches)] : [];
};

const Sidebar = ({ 
  notes, activeNoteId, notebookTitle, searchQuery, setSearchQuery, 
  onNoteClick, onCreateNote, activeTab, setActiveTab, 
  sidebarOpen, setSidebarOpen, setShowHelp 
}) => {
  const [sortMode, setSortMode] = useState('Date'); // Date, Title, Category

  const toggleSort = () => {
    if (sortMode === 'Date') setSortMode('Title');
    else if (sortMode === 'Title') setSortMode('Category');
    else setSortMode('Date');
  };

  const filteredNotes = notes
    .filter(n => {
      const titleMatch = (n.title || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      const contentMatch = (n.content || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      return !searchQuery || titleMatch || contentMatch;
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sortMode === 'Title') return a.title.localeCompare(b.title);
      if (sortMode === 'Category') {
        const catA = a.category?.toLowerCase() || 'general';
        const catB = b.category?.toLowerCase() || 'general';
        if (catA !== catB) return catA.localeCompare(catB);
      }
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

  const groupedNotes = filteredNotes.reduce((acc, note) => {
    const folder = note.folder || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(note);
    return acc;
  }, {});

  return (
    <aside className={`sidebar ${sidebarOpen ? 'mobile-visible' : ''}`}>
      <div className="sidebar-header">
        <h2>{notebookTitle || 'Notebook'}</h2>
        <button className="btn-icon mobile-only" onClick={() => setSidebarOpen(false)}>
          <FontAwesomeIcon icon={faXmark} size="lg" />
        </button>
      </div>

      <div style={{display:'flex', padding:'0 1.5rem 1rem', gap:'8px', flexWrap: 'wrap'}}>
        <button className={`btn-icon ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')} title="Notes">
          <FontAwesomeIcon icon={faFileLines} />
        </button>
        <button className={`btn-icon ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')} title="Inbox">
          <FontAwesomeIcon icon={faEnvelope} />
        </button>
        <button className={`btn-icon ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')} title="Calendar">
          <FontAwesomeIcon icon={faCalendarDays} />
        </button>
        <button className={`btn-icon ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')} title="Tasks">
          <FontAwesomeIcon icon={faSquareCheck} />
        </button>
        <button className={`btn-icon ${activeTab === 'passwords' ? 'active' : ''}`} onClick={() => setActiveTab('passwords')} title="Vault">
          <FontAwesomeIcon icon={faLock} />
        </button>
      </div>

      <div className="search-container">
        <div style={{display:'flex', gap:'10px'}}>
          <div style={{position:'relative', flex: 1}}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', opacity:0.5}} />
            <input 
              type="text" 
              className="standard-input" 
              placeholder="Search..." 
              style={{paddingLeft:'35px'}}
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <button className="btn-icon" onClick={toggleSort} title={`Sort: ${sortMode}`} style={{fontSize: '0.8rem', fontWeight: 'bold'}}>
            {sortMode.slice(0, 3)}
          </button>
        </div>
      </div>

      <div className="notes-list">
        {Object.entries(groupedNotes).map(([folder, folderNotes]) => (
          <div key={folder}>
            <div className="folder-header">
              <FontAwesomeIcon icon={faFolder} size="xs" /> {folder}
            </div>
            <AnimatePresence mode="popLayout">
              {folderNotes.map(n => (
                <motion.div 
                  layout key={n.id} 
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
                    {n.category && <div className="note-category-tag">{n.category}</div>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="sidebar-footer" style={{display:'flex', gap:'10px', padding:'1.5rem'}}>
        <button className="btn-icon" onClick={() => setShowHelp(true)} title="Help">
          <FontAwesomeIcon icon={faCircleQuestion} />
        </button>
        <button className={`btn-icon ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} title="Settings">
          <FontAwesomeIcon icon={faPalette} />
        </button>
        <button className="login-btn" style={{flex:1, height:'42px', padding:'0'}} onClick={() => onCreateNote()}>
          <FontAwesomeIcon icon={faPlus} style={{marginRight:'8px'}} /> New Note
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;