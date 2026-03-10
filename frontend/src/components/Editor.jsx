import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faThumbtack, faTrashCan, faDownload } from '@fortawesome/free-solid-svg-icons';

const Editor = ({ 
  activeNote, handleUpdateActiveNote, handleExport, 
  handleDeleteNote, setSidebarOpen, isSaving, toggleMarkdownTodo 
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="view-container">
      <header className="editor-header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
          <FontAwesomeIcon icon={faBars} size="lg" />
        </button>
        {activeNote ? (
          <>
            <input 
              className="title-input" 
              value={activeNote.title} 
              onChange={(e) => handleUpdateActiveNote({ title: e.target.value })} 
            />
            
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <input 
                type="text"
                placeholder="Category"
                className="date-input-ghost"
                style={{width: '120px', fontSize: '0.8rem'}}
                value={activeNote.category || ''}
                onChange={(e) => handleUpdateActiveNote({ category: e.target.value })}
              />

              <input 
                type="date"
                className="date-input-ghost"
                value={activeNote.date ? activeNote.date.split('T')[0] : ''}
                onChange={(e) => handleUpdateActiveNote({ date: e.target.value })}
              />

              <button className="btn-icon" onClick={handleExport} title="Export .md">
                <FontAwesomeIcon icon={faDownload} />
              </button>
              <button className="btn-icon" onClick={() => handleUpdateActiveNote({ isPinned: !activeNote.isPinned })}>
                <FontAwesomeIcon icon={faThumbtack} color={activeNote.isPinned ? "var(--accent-color)" : "inherit"} />
              </button>
              <button className="btn-icon" onClick={() => handleDeleteNote(activeNote.id)}>
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </div>
          </>
        ) : <div className="title-input">Select a Note</div>}
      </header>
      <div className="editor-body">
        {activeNote ? (
          <>
            <div className="editor-pane">
              <textarea 
                className="markdown-editor" 
                value={activeNote.content} 
                onChange={(e) => handleUpdateActiveNote({ content: e.target.value })} 
                placeholder="Start writing..." 
              />
            </div>
            <div className="preview-pane">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                components={{
                  input: ({ checked, ...props }) => {
                    if (props.type === 'checkbox') return (
                      <input 
                        type="checkbox" 
                        checked={checked} 
                        readOnly 
                        onClick={(e) => {
                          const all = document.querySelectorAll('.preview-pane input[type="checkbox"]');
                          toggleMarkdownTodo(Array.from(all).indexOf(e.target));
                        }} 
                      />
                    )
                    return <input {...props} />
                  }
                }}
              >
                {activeNote.content}
              </ReactMarkdown>
            </div>
          </>
        ) : (
          <div style={{flex:1, display:'flex', justifyContent:'center', alignItems:'center', opacity: 0.5}}>
            <h2>Choose a note from the sidebar.</h2>
          </div>
        )}
      </div>
      {activeNote && (
        <footer className="editor-footer">
          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
            <div className={`save-dot ${isSaving ? 'saving' : ''}`} /> 
            {isSaving ? 'Saving...' : 'Synced'}
          </div>
          <div>{activeNote.content?.length || 0} characters</div>
        </footer>
      )}
    </motion.div>
  );
};

export default Editor;
