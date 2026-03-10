import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Pin, FileText, Calendar, CheckSquare, Palette, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const Sidebar = ({ 
  notes, activeNoteId, searchQuery, setSearchQuery, 
  onNoteClick, onCreateNote, activeTab, setActiveTab, 
  sidebarOpen, setSidebarOpen 
}) => {
  const filteredNotes = notes
    .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (a.isPinned === b.isPinned ? new Date(b.createdAt) - new Date(a.createdAt) : a.isPinned ? -1 : 1));

  return (
    <aside className={`sidebar ${sidebarOpen ? 'mobile-visible' : ''}`}>
      <div className="sidebar-header">
        <h2>Notebook</h2>
        <button className="btn-icon mobile-only" onClick={() => setSidebarOpen(false)}><X size={20}/></button>
      </div>

      <div style={{display:'flex', padding:'0 1.5rem 1rem', gap:'10px'}}>
        <button className={`btn-icon ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')} title="Notes"><FileText size={18}/></button>
        <button className={`btn-icon ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')} title="Calendar"><Calendar size={18}/></button>
        <button className={`btn-icon ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')} title="Tasks"><CheckSquare size={18}/></button>
        <button className={`btn-icon ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} title="Settings"><Palette size={18}/></button>
      </div>

      <div className="search-container">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
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
                {n.isPinned && <Pin size={12} fill="var(--accent-color)" style={{marginRight:6}}/>}
                {n.title || 'Untitled'}
              </div>
              <div className="note-meta">{format(parseISO(n.createdAt), 'MMM d')}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="sidebar-footer">
        <button className="login-btn" style={{padding:'0.6rem'}} onClick={() => onCreateNote()}>
          <Plus size={18} style={{marginRight:8}}/> New Note
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
