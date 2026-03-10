import { useState, useEffect, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { format, isSameDay, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Plus, Settings, Calendar as CalendarIcon, 
  CheckSquare, LogOut, Sun, Moon, Pin, 
  Trash2, Menu, X, ArrowLeft, ListChecks, FileText, Palette
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
  
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('notebook_theme') || 'dark')
  const [accentColor, setAccentColor] = useState(localStorage.getItem('notebook_accent') || '#7c4dff')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('notes') // 'notes', 'calendar', 'todos', 'settings'
  
  const [todos, setTodos] = useState([])
  const [newTodoTask, setNewTodoTask] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())

  const textareaRef = useRef(null)

  // --- Theme & Appearance Logic ---
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : ''
    document.documentElement.style.setProperty('--accent-color', accentColor)
    localStorage.setItem('notebook_theme', theme)
    localStorage.setItem('notebook_accent', accentColor)
  }, [theme, accentColor])

  // --- Initial Data ---
  useEffect(() => {
    if (token) {
      fetchNotes()
      fetchTodos()
    } else setLoading(false)
  }, [token])

  // --- Auto-save ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeNote && activeNote._isDirty) saveNoteToServer(activeNote)
    }, 1000)
    return () => clearTimeout(delayDebounceFn)
  }, [activeNote?.content, activeNote?.title])

  const saveNoteToServer = async (note) => {
    setIsSaving(true)
    try {
      await fetch(`${API_URL}/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ title: note.title, content: note.content, category: note.category, isPinned: note.isPinned, date: note.date })
      })
      setActiveNote(prev => prev?.id === note.id ? { ...prev, _isDirty: false } : prev)
    } catch (err) { console.error(err) }
    finally { setIsSaving(false) }
  }

  // --- API ---
  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notes`, { headers: { 'Authorization': token } })
      if (res.status === 401) return handleLogout()
      const data = await res.json()
      setNotes(data)
      if (data.length > 0 && !activeNote) setActiveNote(data[0])
      setLoading(false)
    } catch (err) { setLoading(false) }
  }

  const fetchTodos = async () => {
    try {
      const res = await fetch(`${API_URL}/todos`, { headers: { 'Authorization': token } })
      if (res.ok) setTodos(await res.json())
    } catch (err) { console.error(err) }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      const data = await res.json()
      if (res.ok) { setToken(data.token); localStorage.setItem('notebook_token', data.token); }
      else setLoginError(data.error)
    } catch (err) { setLoginError('Server error') }
  }

  const handleLogout = () => { setToken(''); localStorage.clear(); setNotes([]); setActiveNote(null); setActiveTab('notes'); }

  const handleCreateNote = async (initialDate = null) => {
    try {
      const newNote = { title: 'New Note', content: '# New Note', category: 'General', date: initialDate ? initialDate.toISOString() : null }
      const res = await fetch(`${API_URL}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(newNote) })
      const data = await res.json()
      setNotes([data, ...notes]); setActiveNote(data); setActiveTab('notes');
    } catch (err) { console.error(err) }
  }

  const handleUpdateActiveNote = (updates) => {
    setActiveNote(prev => ({ ...prev, ...updates, _isDirty: true }))
    setNotes(prevNotes => prevNotes.map(n => n.id === activeNote.id ? { ...n, ...updates } : n))
  }

  const toggleMarkdownTodo = (index) => {
    const lines = activeNote.content.split('\n')
    let taskCount = 0
    const newLines = lines.map(line => {
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        if (taskCount === index) { taskCount++; return line.includes('[ ]') ? line.replace('[ ]', '[x]') : line.replace('[x]', '[ ]') }
        taskCount++
      }
      return line
    })
    handleUpdateActiveNote({ content: newLines.join('\n') })
  }

  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.isPinned === b.isPinned ? new Date(b.createdAt) - new Date(a.createdAt) : a.isPinned ? -1 : 1))
  }, [notes, searchQuery])

  // --- Views ---
  const EditorView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <header className="editor-header">
        {activeNote ? (
          <>
            <input className="title-input" value={activeNote.title} onChange={(e) => handleUpdateActiveNote({ title: e.target.value })} />
            <button className="btn-icon" onClick={() => handleUpdateActiveNote({ isPinned: !activeNote.isPinned })}>
              <Pin size={18} fill={activeNote.isPinned ? "var(--accent-color)" : "none"} />
            </button>
            <button className="btn-icon" onClick={() => { if(window.confirm('Delete?')) fetch(`${API_URL}/notes/${activeNote.id}`, { method: 'DELETE', headers: { 'Authorization': token } }).then(() => fetchNotes()) }}><Trash2 size={18} /></button>
          </>
        ) : <div className="title-input">Select a Note</div>}
      </header>
      <div className="editor-body">
        {activeNote ? (
          <>
            <div className="editor-pane">
              <textarea ref={textareaRef} className="markdown-editor" value={activeNote.content} onChange={(e) => handleUpdateActiveNote({ content: e.target.value })} placeholder="Start writing..." />
            </div>
            <div className="preview-pane">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                input: ({ checked, ...props }) => {
                  if (props.type === 'checkbox') return <input type="checkbox" checked={checked} onClick={(e) => {
                    const all = document.querySelectorAll('.preview-pane input[type="checkbox"]');
                    toggleMarkdownTodo(Array.from(all).indexOf(e.target));
                  }} />
                  return <input {...props} />
                }
              }}>{activeNote.content}</ReactMarkdown>
            </div>
          </>
        ) : <div style={{flex:1, display:'flex', justifyContent:'center', alignItems:'center'}}><h2>Click a note to start.</h2></div>}
      </div>
      {activeNote && <footer className="editor-footer">
        <div style={{display:'flex', alignItems:'center', gap:'8px'}}><div className={`save-dot ${isSaving ? 'saving' : ''}`} /> {isSaving ? 'Saving...' : 'Synced'}</div>
        <div>{activeNote.content.length} characters</div>
      </footer>}
    </motion.div>
  )

  if (!token) return (
    <div className="login-container">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="login-card">
        <h1 style={{fontSize:'2.5rem', marginBottom:'1rem'}}>Notebook Pro</h1>
        <form onSubmit={handleLogin}>
          <input type="password" className="login-input" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          {loginError && <div style={{color:'#ff4444', marginBottom:'1rem'}}>{loginError}</div>}
          <button type="submit" className="login-btn">Sign In</button>
        </form>
      </motion.div>
    </div>
  )

  return (
    <div className="app-container">
      <div className="bg-blobs">
        <div className="blob" style={{ top: '10%', left: '10%' }} />
        <div className="blob" style={{ bottom: '10%', right: '10%', background: '#ff4081', width: '30vw', height: '30vw' }} />
      </div>

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Notes</h2>
          <button className="btn-icon" onClick={() => handleCreateNote()}><Plus size={20} /></button>
        </div>
        <div className="search-container">
          <input type="text" className="search-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="notes-list">
          {filteredNotes.map(n => (
            <div key={n.id} className={`note-item ${activeNote?.id === n.id ? 'active' : ''}`} onClick={() => { setActiveNote(n); setActiveTab('notes'); }}>
              <div className="note-title-small">{n.isPinned && <Pin size={12} fill="var(--accent-color)" style={{marginRight:6}}/>}{n.title}</div>
              <div className="note-meta">{format(parseISO(n.createdAt), 'MMM d')}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile Navigation Bar */}
      <nav className="mobile-nav">
        <button className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}><FileText size={24}/><span>Notes</span></button>
        <button className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}><CalendarIcon size={24}/><span>Plan</span></button>
        <button className={`nav-item ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}><CheckSquare size={24}/><span>Tasks</span></button>
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Palette size={24}/><span>Style</span></button>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'notes' && <EditorView key="editor" />}
          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="calendar-view">
              <div className="calendar-container">
                <Calendar onChange={setCalendarDate} value={calendarDate} tileClassName={({ date, view }) => view === 'month' && notes.find(n => n.date && isSameDay(parseISO(n.date), date)) ? 'has-notes' : ''} />
              </div>
              <div className="day-notes-list" style={{padding:'1rem'}}>
                <h3>{format(calendarDate, 'MMMM d')}</h3>
                {notes.filter(n => n.date && isSameDay(parseISO(n.date), calendarDate)).map(n => (
                  <div key={n.id} className="note-item" onClick={() => { setActiveNote(n); setActiveTab('notes'); }}>{n.title}</div>
                ))}
                <button className="btn-icon" style={{width:'100%', marginTop:'1rem'}} onClick={() => handleCreateNote(calendarDate)}>+ Add for this day</button>
              </div>
            </motion.div>
          )}
          {activeTab === 'todos' && (
            <motion.div key="todos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="settings-container">
              <div className="settings-card">
                <h2>Tasks</h2>
                <form style={{display:'flex', gap:'10px', margin:'1rem 0'}} onSubmit={(e) => {
                  e.preventDefault();
                  fetch(`${API_URL}/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify({ task: newTodoTask }) }).then(() => { fetchTodos(); setNewTodoTask(''); })
                }}>
                  <input className="login-input" style={{marginBottom:0}} placeholder="New task..." value={newTodoTask} onChange={e => setNewTodoTask(e.target.value)} />
                  <button type="submit" className="login-btn" style={{width:'80px'}}>Add</button>
                </form>
                {todos.map(t => (
                  <div key={t.id} className="note-item" style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <input type="checkbox" checked={t.completed} onChange={() => fetch(`${API_URL}/todos/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify({ completed: !t.completed }) }).then(() => fetchTodos())} />
                    <span style={{flex:1, textDecoration: t.completed ? 'line-through' : 'none'}}>{t.task}</span>
                    <Trash2 size={16} color="#ff4444" onClick={() => fetch(`${API_URL}/todos/${t.id}`, { method: 'DELETE', headers: { 'Authorization': token } }).then(() => fetchTodos())} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="settings-container">
              <div className="settings-card">
                <h1 style={{marginBottom:'2rem'}}>Appearance</h1>
                <div className="settings-row">
                  <span>Dark / Light Mode</span>
                  <button className="btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun /> : <Moon />}</button>
                </div>
                <div className="settings-row" style={{flexDirection:'column', alignItems:'flex-start'}}>
                  <span>Accent Color</span>
                  <div className="color-grid">
                    {['#7c4dff', '#ff4081', '#00e676', '#ffea00', '#00b0ff', '#ffffff'].map(c => (
                      <div key={c} className={`color-circle ${accentColor === c ? 'active' : ''}`} style={{background:c}} onClick={() => setAccentColor(c)} />
                    ))}
                  </div>
                </div>
                <div className="settings-row" style={{marginTop:'2rem', border:'none'}}>
                  <button className="login-btn" style={{background:'#ff4444'}} onClick={handleLogout}>Sign Out</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
