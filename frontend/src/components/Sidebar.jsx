import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faPlus, faThumbtack, faFileLines, faCalendarDays, faSquareCheck, faPalette, faXmark, faFilter } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';

const Sidebar = ({ 
  notes, activeNoteId, searchQuery, setSearchQuery, 
  onNoteClick, onCreateNote, activeTab, setActiveTab, 
  sidebarOpen, setSidebarOpen, sortByCategory, setSortByCategory
}) => {
  const filteredNotes = notes
    .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortByCategory) {
        const catA = a.category?.toLowerCase() || 'general';
        const catB = b.category?.toLowerCase() || 'general';
        if (catA !== catB) return catA.localeCompare(catB);
      }
      return (a.isPinned === b.isPinned ? new Date(b.createdAt) - new Date(a.createdAt) : a.isPinned ? -1 : 1);
    });

  return (
    <aside className={`sidebar ${sidebarOpen ? 'mobile-visible' : ''}`}>
      <div className="sidebar-header">
        <h2>Notebook</h2>
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
            className={`btn-icon ${sortByCategory ? 'active' : ''}`} 
            onClick={() => setSortByCategory(!sortByCategory)} 
            title="Sort by Category"
            style={{width: '42px', height: '42px'}}
          >
            <FontAwesomeIcon icon={faFilter} size="sm" />
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

      <div className="sidebar-footer">
        <button className="login-btn" style={{padding:'0.6rem'}} onClick={() => onCreateNote()}>
          <FontAwesomeIcon icon={faPlus} style={{marginRight:'8px'}} /> New Note
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
