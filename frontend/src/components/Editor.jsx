import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faThumbtack, faTrashCan, faDownload, faBold, faItalic, faCode, faLink } from '@fortawesome/free-solid-svg-icons';

const Editor = ({ 
  activeNote, handleUpdateActiveNote, handleExport, 
  handleDeleteNote, setSidebarOpen, isSaving, toggleMarkdownTodo 
}) => {
  const textareaRef = useRef(null);

  const insertText = (before, after = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    handleUpdateActiveNote({ content: newText });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const wordCount = activeNote?.content ? activeNote.content.split(/\s+/).filter(w => w.length > 0).length : 0;
  const readingTime = Math.ceil(wordCount / 200) || 1;

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
            <div className="editor-pane" style={{flexDirection: 'column', padding: '1.5rem 3rem'}}>
              <div style={{display: 'flex', gap: '10px', marginBottom: '1rem'}}>
                <button className="btn-icon" style={{width: 36, height: 36}} onClick={() => insertText('**', '**')} title="Bold"><FontAwesomeIcon icon={faBold} size="sm" /></button>
                <button className="btn-icon" style={{width: 36, height: 36}} onClick={() => insertText('_', '_')} title="Italic"><FontAwesomeIcon icon={faItalic} size="sm" /></button>
                <button className="btn-icon" style={{width: 36, height: 36}} onClick={() => insertText('`', '`')} title="Code"><FontAwesomeIcon icon={faCode} size="sm" /></button>
                <button className="btn-icon" style={{width: 36, height: 36}} onClick={() => insertText('[', '](url)')} title="Link"><FontAwesomeIcon icon={faLink} size="sm" /></button>
              </div>
              <textarea 
                ref={textareaRef}
                className="markdown-editor" 
                value={activeNote.content} 
                onChange={(e) => handleUpdateActiveNote({ content: e.target.value })} 
                placeholder="Start writing..." 
                style={{flex: 1}}
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
          <div style={{display:'flex', gap:'15px'}}>
            <span>{wordCount} words</span>
            <span>{readingTime} min read</span>
          </div>
        </footer>
      )}
    </motion.div>
  );
};

export default Editor;
