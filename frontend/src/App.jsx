import { useState, useEffect, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { format, isSameDay, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Plus, Settings, Calendar as CalendarIcon, 
  CheckSquare, LogOut, Sun, Moon, Pin, Save, 
  Trash2, Download, Menu, X, ArrowLeft, ChevronRight
} from 'lucide-react'
import './App.css'

const API_URL = '/api'

function App() {
  // --- States ---
  const [token, setToken] = useState(localStorage.getItem('notebook_token') || '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [theme, setTheme] = useState(localStorage.getItem('notebook_theme') || 'dark')
  const [isSaving, setIsSaving] = useState(false)
  const [view, setView] = useState('editor') // 'editor', 'calendar', 'settings'
  
  const [showTodos, setShowTodos] = useState(false)
  const [todos, setTodos] = useState([])
  const [newTodoTask, setNewTodoTask] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())

  // --- Effects ---
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : ''
    localStorage.setItem('notebook_theme', theme)
  }, [theme])

  useEffect(() => {
    if (token) fetchNotes()
    else setLoading(false)
  }, [token])

  // --- Auto-save Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeNote && activeNote._isDirty) {
        saveNoteToServer(activeNote)
      }
    }, 1000)

    return () => clearTimeout(delayDebounceFn)
  }, [activeNote?.content, activeNote?.title, activeNote?.category])

  const saveNoteToServer = async (note) => {
    setIsSaving(true)
    try {
      await fetch(`${API_URL}/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ 
          title: note.title, 
          content: note.content, 
          category: note.category,
          isPinned: note.isPinned,
          date: note.date
        })
      })
      // Clear dirty flag
      setActiveNote(prev => prev?.id === note.id ? { ...prev, _isDirty: false } : prev)
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // --- API Actions ---
  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notes`, { headers: { 'Authorization': token } })
      if (res.status === 401) return handleLogout()
      const data = await res.json()
      setNotes(data)
      if (data.length > 0 && !activeNote) setActiveNote(data[0])
      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.token)
        localStorage.setItem('notebook_token', data.token)
        setLoginError('')
      } else {
        setLoginError(data.error)
      }
    } catch (err) { setLoginError('Server error') }
  }

  const handleLogout = () => {
    setToken('')
    localStorage.removeItem('notebook_token')
    setNotes([])
    setActiveNote(null)
    setView('editor')
  }

  const handleCreateNote = async (initialDate = null) => {
    try {
      const newNote = { 
        title: 'New Note', 
        content: '# New Note', 
        category: 'General', 
        isPinned: false,
        date: initialDate ? initialDate.toISOString() : null
      }
      const res = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(newNote)
      })
      const data = await res.json()
      setNotes([data, ...notes])
      setActiveNote(data)
      setSidebarOpen(false)
      setView('editor')
    } catch (err) { console.error(err) }
  }

  const handleUpdateActiveNote = (updates) => {
    setActiveNote(prev => ({ ...prev, ...updates, _isDirty: true }))
    setNotes(prevNotes => prevNotes.map(n => n.id === activeNote.id ? { ...n, ...updates } : n))
  }

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return
    try {
      await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE', headers: { 'Authorization': token } })
      const updatedNotes = notes.filter(n => n.id !== id)
      setNotes(updatedNotes)
      if (activeNote?.id === id) setActiveNote(updatedNotes[0] || null)
    } catch (err) { console.error(err) }
  }

  // --- Derived ---
  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => categoryFilter === 'All' || n.category === categoryFilter)
      .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return sortBy === 'date-desc' ? new Date(b.createdAt) - new Date(a.createdAt) : (a.title || '').localeCompare(b.title || '')
      })
  }, [notes, searchQuery, sortBy, categoryFilter])

  // --- Components ---
  const LoginView = () => (
    <div className="login-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-card"
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Notebook Pro</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Secure your thoughts with elegance.</p>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            className="login-input" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            autoFocus 
          />
          {loginError && <div className="login-error">{loginError}</div>}
          <button type="submit" className="login-btn">Unlock</button>
        </form>
      </motion.div>
    </div>
  )

  const SidebarItem = ({ note }) => (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
      onClick={() => { setActiveNote(note); setView('editor'); setSidebarOpen(false); }}
    >
      <div className="note-title-small">
        {note.isPinned && <Pin size={12} fill="var(--accent-color)" style={{ marginRight: 6 }} />}
        {note.title || 'Untitled'}
      </div>
      <div className="note-meta">
        <span>{note.category}</span>
        <span>{format(parseISO(note.createdAt), 'MMM d')}</span>
      </div>
    </motion.div>
  )

  if (!token) return <LoginView />
  if (loading) return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Notebook</h2>
          <button className="btn-icon" onClick={() => setView('settings')} title="Settings"><Settings size={20} /></button>
        </div>

        <div className="search-container">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search..." 
              style={{ paddingLeft: 38 }}
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        <div className="notes-list">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map(note => <SidebarItem key={note.id} note={note} />)}
          </AnimatePresence>
        </div>

        <div className="sidebar-footer">
          <button className="btn-icon" onClick={() => setView('calendar')} title="Calendar"><CalendarIcon size={20} /></button>
          <button className="btn-icon" onClick={() => setShowTodos(true)} title="Tasks"><CheckSquare size={20} /></button>
          <button className="btn-icon" onClick={() => handleCreateNote()} style={{ flex: 1, width: 'auto', background: 'var(--accent-color)', color: 'white' }}>
            <Plus size={20} /> <span style={{ marginLeft: 8 }}>New Note</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {view === 'settings' ? (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="settings-container"
            >
              <div className="settings-section">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                  <button className="btn-icon" onClick={() => setView('editor')} style={{ marginRight: '1rem' }}><ArrowLeft size={20} /></button>
                  <h1>Settings</h1>
                </div>
                
                <div className="settings-row">
                  <div>
                    <h3>Appearance</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Choose between light and dark themes.</p>
                  </div>
                  <button className="btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                </div>

                <div className="settings-row">
                  <div>
                    <h3>Sort Order</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>How your notes are ordered in the sidebar.</p>
                  </div>
                  <select className="login-input" style={{ width: 150, marginBottom: 0 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="date-desc">Newest First</option>
                    <option value="alpha-asc">A - Z</option>
                  </select>
                </div>

                <div className="settings-row">
                  <div>
                    <h3>Logout</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Sign out of your account on this device.</p>
                  </div>
                  <button className="btn-icon" onClick={handleLogout} style={{ border: '1px solid #ff4444', color: '#ff4444' }}><LogOut size={20} /></button>
                </div>
              </div>
            </motion.div>
          ) : view === 'calendar' ? (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="calendar-view"
            >
               <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <button className="btn-icon" onClick={() => setView('editor')} style={{ marginRight: '1rem' }}><ArrowLeft size={20} /></button>
                  <h1>Calendar</h1>
                </div>
              <div className="calendar-container">
                <Calendar 
                  onChange={setCalendarDate} 
                  value={calendarDate} 
                  tileClassName={({ date, view }) => view === 'month' && notes.find(n => n.date && isSameDay(parseISO(n.date), date)) ? 'has-notes' : ''} 
                />
              </div>
              <div className="day-notes-list">
                <h3>Notes for {format(calendarDate, 'MMMM d, yyyy')}</h3>
                <div className="notes-list">
                  {notes.filter(n => n.date && isSameDay(parseISO(n.date), calendarDate)).map(note => (
                    <div key={note.id} className="note-item" onClick={() => { setActiveNote(note); setView('editor'); }}>
                      <div className="note-title-small">{note.title}</div>
                      <div className="note-meta">{note.category}</div>
                    </div>
                  ))}
                  <button className="btn-icon" style={{ width: '100%', marginTop: '1rem' }} onClick={() => handleCreateNote(calendarDate)}>+ Add Note for this day</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <header className="editor-header">
                <button className="menu-toggle" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
                {activeNote ? (
                  <>
                    <input className="title-input" value={activeNote.title} onChange={(e) => handleUpdateActiveNote({ title: e.target.value })} placeholder="Note Title" />
                    <input className="category-input" value={activeNote.category} onChange={(e) => handleUpdateActiveNote({ category: e.target.value })} placeholder="Category" />
                    <button className={`btn-icon ${activeNote.isPinned ? 'active' : ''}`} onClick={() => handleUpdateActiveNote({ isPinned: !activeNote.isPinned })}>
                      <Pin size={18} fill={activeNote.isPinned ? "var(--accent-color)" : "none"} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDeleteNote(activeNote.id)}><Trash2 size={18} /></button>
                  </>
                ) : <div className="title-input">Select a note</div>}
              </header>

              <div className="editor-body">
                {activeNote ? (
                  <>
                    <div className="editor-pane">
                      <textarea className="markdown-editor" value={activeNote.content} onChange={(e) => handleUpdateActiveNote({ content: e.target.value })} placeholder="Start typing your ideas..." />
                    </div>
                    <div className="preview-pane">
                      <ReactMarkdown>{activeNote.content}</ReactMarkdown>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-dim)' }}>
                    <h2>Create a new note to start writing.</h2>
                  </div>
                )}
              </div>

              {activeNote && (
                <footer className="editor-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className={`save-dot ${isSaving ? 'saving' : ''}`} />
                    {isSaving ? 'Saving...' : 'All changes saved'}
                  </div>
                  <div>{activeNote.content.split(/\s+/).length} words</div>
                  <div>Last edited {format(parseISO(activeNote.updatedAt || activeNote.createdAt), 'HH:mm')}</div>
                </footer>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" 
            style={{ background: 'rgba(0,0,0,0.3)', zIndex: 90 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
