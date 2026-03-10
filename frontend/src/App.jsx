import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileLines, faCalendarDays, faSquareCheck, faPalette, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import Planner from './components/Planner'
import Tasks from './components/Tasks'
import Settings from './components/Settings'
import Auth from './components/Auth'
import Emails from './components/Emails'
import Passwords from './components/Passwords'
import './App.css'

const API_URL = '/api'

function App() {
  // --- States ---
  const [token, setToken] = useState(localStorage.getItem('notebook_token') || '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [activeTab, setActiveTab] = useState('notes')
  const [notebookTitle, setNotebookTitle] = useState(localStorage.getItem('notebookTitle') || 'Notebook')
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('notebook_theme') || 'dark')
  const [accentColor, setAccentColor] = useState(localStorage.getItem('notebook_accent') || '#7c4dff')
  const [bgBlobs, setBgBlobs] = useState(localStorage.getItem('notebook_blobs') !== 'false')
  const [showHelp, setShowHelp] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [todos, setTodos] = useState([])
  const [calendarDate, setCalendarDate] = useState(new Date())

  // --- Effects ---
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : ''
    document.documentElement.style.setProperty('--accent-color', accentColor)
    localStorage.setItem('notebook_theme', theme)
    localStorage.setItem('notebook_accent', accentColor)
    localStorage.setItem('notebook_blobs', bgBlobs)
    localStorage.setItem('notebookTitle', notebookTitle)
  }, [theme, accentColor, bgBlobs, notebookTitle])

  useEffect(() => {
    if (token) {
      Promise.all([fetchNotes(), fetchTodos()])
        .then(() => setLoading(false))
        .catch(err => {
          console.error("Failed to fetch data:", err);
          setLoading(false);
        });
    } else setLoading(false)
  }, [token])

  // --- API Handlers ---
  const fetchNotes = async () => {
    const res = await fetch(`${API_URL}/notes`, { headers: { 'Authorization': token } })
    if (res.status === 401) return handleLogout()
    const data = await res.json()
    setNotes(data)
    if (data.length > 0 && !activeNote) setActiveNote(data[0])
  }

  const fetchTodos = async () => {
    const res = await fetch(`${API_URL}/todos`, { headers: { 'Authorization': token } })
    if (res.ok) setTodos(await res.json())
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const res = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    const data = await res.json()
    if (res.ok) { setToken(data.token); localStorage.setItem('notebook_token', data.token); }
    else setLoginError(data.error)
  }

  const handleLogout = () => { setToken(''); localStorage.clear(); setNotes([]); setActiveNote(null); setActiveTab('notes'); }

  const saveNoteToServer = useCallback(async (note) => {
    if (!note) return;
    setIsSaving(true)
    try {
      const res = await fetch(`${API_URL}/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ title: note.title, content: note.content, category: note.category, folder: note.folder, isPinned: note.isPinned, date: note.date })
      })
      if (res.ok) {
        const updated = await res.json()
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
        setActiveNote(prev => prev?.id === updated.id ? { ...updated, _isDirty: false } : prev)
      }
    } finally { setIsSaving(false) }
  }, [token]);

  useEffect(() => {
    if (!activeNote || !activeNote._isDirty) return
    const timer = setTimeout(() => saveNoteToServer(activeNote), 1200)
    return () => clearTimeout(timer)
  }, [activeNote?.content, activeNote?.title, activeNote?.category, activeNote?.isPinned, activeNote?.date, saveNoteToServer])

  const handleCreateNote = useCallback(async (initialDate = null) => {
    let dateStr = null;
    if (initialDate) {
      const tzOffset = initialDate.getTimezoneOffset() * 60000;
      dateStr = (new Date(initialDate.getTime() - tzOffset)).toISOString().split('T')[0];
    }
    const newNote = { title: 'New Note', content: '# New Note', category: 'General', date: dateStr }
    const res = await fetch(`${API_URL}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(newNote) })
    const data = await res.json()
    setNotes(prev => [data, ...prev]); 
    setActiveNote(data); 
    setActiveTab('notes'); 
    setSidebarOpen(false);
  }, [token]);

  const handleUpdateActiveNote = useCallback((updates) => {
    setActiveNote(prev => prev ? ({ ...prev, ...updates, _isDirty: true }) : null)
  }, []);

  const handleDeleteNote = useCallback(async (id) => {
    if (!window.confirm('Delete this note?')) return
    await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE', headers: { 'Authorization': token } })
    setNotes(prev => prev.filter(n => n.id !== id))
    setActiveNote(prev => prev?.id === id ? null : prev)
  }, [token]);

  const toggleMarkdownTodo = (index) => {
    if (!activeNote) return;
    const lines = activeNote.content.split('\n')
    let count = 0
    const newLines = lines.map(line => {
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        if (count === index) { count++; return line.includes('[ ]') ? line.replace('[ ]', '[x]') : line.replace('[x]', '[ ]') }
        count++
      }
      return line
    })
    handleUpdateActiveNote({ content: newLines.join('\n') })
  }

  const handleExport = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${activeNote.title}.md`; a.click();
  }

  const handleExportAll = () => {
    const data = JSON.stringify({ notes, todos }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'notebook_backup.json'; a.click();
  }

  const handleImportAll = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.notes) {
          for (const n of data.notes) {
            await fetch(`${API_URL}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(n) });
          }
        }
        if (data.todos) {
          for (const t of data.todos) {
            await fetch(`${API_URL}/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(t) });
          }
        }
        fetchNotes();
        fetchTodos();
        alert('Import successful!');
      } catch (err) {
        alert('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
  }

  // --- Keyboard Shortcut Logic ---
  const keyboardRef = useRef({ activeNote, activeTab, handleCreateNote, handleUpdateActiveNote, handleDeleteNote, saveNoteToServer, setActiveTab });
  
  useEffect(() => {
    keyboardRef.current = { activeNote, activeTab, handleCreateNote, handleUpdateActiveNote, handleDeleteNote, saveNoteToServer, setActiveTab };
  }, [activeNote, activeTab, handleCreateNote, handleUpdateActiveNote, handleDeleteNote, saveNoteToServer, setActiveTab]);

  useEffect(() => {
    if (!token) return;

    const handleKeyDown = (e) => {
      const state = keyboardRef.current;
      const key = e.key.toLowerCase();
      const isCmd = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // 1. Tab switching
      if (isAlt && isCmd) {
        const tabs = { '1': 'notes', '2': 'emails', '3': 'calendar', '4': 'todos', '5': 'passwords', '6': 'settings' };
        if (tabs[key]) {
          e.preventDefault();
          e.stopPropagation();
          state.setActiveTab(tabs[key]);
          return;
        }
      }

      // 2. Global actions
      if (isCmd) {
        if (key === 'n') {
          e.preventDefault();
          e.stopPropagation();
          state.handleCreateNote();
        } else if (key === 's') {
          e.preventDefault();
          e.stopPropagation();
          if (state.activeNote) state.saveNoteToServer(state.activeNote);
        } else if (key === 'p' && state.activeNote) {
          e.preventDefault();
          e.stopPropagation();
          state.handleUpdateActiveNote({ isPinned: !state.activeNote.isPinned });
        } else if (key === 'f') {
          e.preventDefault();
          e.stopPropagation();
          const searchInput = document.querySelector('.search-input');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
      }

      // 3. Delete note
      if (e.key === 'Delete' && !isInput && state.activeNote && state.activeTab === 'notes') {
        e.preventDefault();
        e.stopPropagation();
        state.handleDeleteNote(state.activeNote.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [token]);

  if (!token) return <Auth password={password} setPassword={setPassword} handleLogin={handleLogin} loginError={loginError} />
  if (loading) return <div className="app-container" style={{justifyContent:'center', alignItems:'center'}}>Loading...</div>

  return (
    <div className="app-container">
      <AnimatePresence>
        {bgBlobs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-blobs">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar 
        notebookTitle={notebookTitle} setShowHelp={setShowHelp}
        notes={notes} activeNoteId={activeNote?.id} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        onNoteClick={(note) => { setActiveNote(note); setActiveTab('notes'); }}
        onCreateNote={handleCreateNote} activeTab={activeTab} setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
      />

      <nav className="mobile-nav">
        <button className={`nav-item ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')}>
          <FontAwesomeIcon icon={faEnvelope} style={{fontSize:'1.4rem'}} />
          <span>Inbox</span>
        </button>
        <button className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
          <FontAwesomeIcon icon={faFileLines} style={{fontSize:'1.4rem'}} />
          <span>Notes</span>
        </button>
        <button className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <FontAwesomeIcon icon={faCalendarDays} style={{fontSize:'1.4rem'}} />
          <span>Plan</span>
        </button>
        <button className={`nav-item ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}>
          <FontAwesomeIcon icon={faSquareCheck} style={{fontSize:'1.4rem'}} />
          <span>Tasks</span>
        </button>
        <button className={`nav-item ${activeTab === 'passwords' ? 'active' : ''}`} onClick={() => setActiveTab('passwords')}>
          <FontAwesomeIcon icon={faLock} style={{fontSize:'1.4rem'}} />
          <span>Vault</span>
        </button>
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <FontAwesomeIcon icon={faPalette} style={{fontSize:'1.4rem'}} />
          <span>Style</span>
        </button>
      </nav>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'notes' && (
            <Editor 
              activeNote={activeNote} handleUpdateActiveNote={handleUpdateActiveNote}
              handleExport={handleExport} handleDeleteNote={handleDeleteNote}
              setSidebarOpen={setSidebarOpen} isSaving={isSaving} toggleMarkdownTodo={toggleMarkdownTodo}
            />
          )}
          {activeTab === 'calendar' && (
            <Planner 
              calendarDate={calendarDate} setCalendarDate={setCalendarDate}
              notes={notes} onNoteClick={(n) => { setActiveNote(n); setActiveTab('notes'); }}
              onCreateNote={handleCreateNote}
            />
          )}
          {activeTab === 'todos' && (
            <Tasks 
              todos={todos}
              handleAddTodo={(newTaskObj) => {
                fetch(`${API_URL}/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(newTaskObj) }).then(() => fetchTodos())
              }}
              handleToggleTodo={(t) => fetch(`${API_URL}/todos/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify({ completed: !t.completed }) }).then(() => fetchTodos())}
              handleUpdateTodo={(id, updates) => fetch(`${API_URL}/todos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(updates) }).then(() => fetchTodos())}
              handleDeleteTodo={(id) => fetch(`${API_URL}/todos/${id}`, { method: 'DELETE', headers: { 'Authorization': token } }).then(() => fetchTodos())}
            />
          )}
          {activeTab === 'passwords' && (
            <Passwords 
              token={token}
              masterPassword={password}
            />
          )}
          {activeTab === 'emails' && (
            <Emails 
              token={token} 
              handleAddTodo={(newTaskObj) => {
                fetch(`${API_URL}/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(newTaskObj) }).then(() => fetchTodos())
              }}
              onCreateNote={handleCreateNote}
            />
          )}
          {activeTab === 'settings' && (
            <Settings 
              notebookTitle={notebookTitle} setNotebookTitle={setNotebookTitle} token={token} 
              theme={theme} setTheme={setTheme} accentColor={accentColor}
              setAccentColor={setAccentColor} handleLogout={handleLogout}
              bgBlobs={bgBlobs} setBgBlobs={setBgBlobs}
              handleExportAll={handleExportAll} handleImportAll={handleImportAll}
            />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showHelp && (
          <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="help-content" onClick={e => e.stopPropagation()}
            >
              <h1 style={{marginBottom:'2rem', fontSize:'2.5rem', fontWeight:900, letterSpacing:'-2px'}}>Help & Guide</h1>
              <div style={{display:'grid', gap:'2rem', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))'}}>
                <div>
                  <h3 style={{color:'var(--accent-color)', marginBottom:'1rem'}}>Keyboard Shortcuts</h3>
                  <ul style={{listStyle:'none', padding:0, fontSize:'0.9rem', lineHeight:2}}>
                    <li><strong>Ctrl + N</strong>: New Note</li>
                    <li><strong>Ctrl + S</strong>: Save/Sync</li>
                    <li><strong>Ctrl + P</strong>: Pin Note</li>
                    <li><strong>Ctrl + F</strong>: Focus Search</li>
                    <li><strong>Delete</strong>: Delete Note</li>
                    <li><strong>Ctrl + Alt + 1-6</strong>: Tabs</li>
                  </ul>
                </div>
                <div>
                  <h3 style={{color:'var(--accent-color)', marginBottom:'1rem'}}>Markdown Support</h3>
                  <ul style={{listStyle:'none', padding:0, fontSize:'0.9rem', lineHeight:2}}>
                    <li><strong># Title</strong>: Header 1</li>
                    <li><strong>**Bold**</strong>: Bold Text</li>
                    <li><strong>*Italic*</strong>: Italic Text</li>
                    <li><strong>- [ ] task</strong>: Checklist</li>
                    <li><strong>`code`</strong>: Inline Code</li>
                    <li><strong>&gt; quote</strong>: Blockquote</li>
                  </ul>
                </div>
              </div>
              <button className="login-btn" style={{marginTop:'2rem'}} onClick={() => setShowHelp(false)}>Close Help</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
