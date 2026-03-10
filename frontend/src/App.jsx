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
  Trash2, Menu, X, ListChecks, FileText, Palette, Download
} from 'lucide-react'
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
  
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('notebook_theme') || 'dark')
  const [accentColor, setAccentColor] = useState(localStorage.getItem('notebook_accent') || '#7c4dff')
  const [isSaving, setIsSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [showTodos, setShowTodos] = useState(false)
  const [todos, setTodos] = useState([])
  const [newTodoTask, setNewTodoTask] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())

  const textareaRef = useRef(null)

  // --- Effects ---
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : ''
    document.documentElement.style.setProperty('--accent-color', accentColor)
    localStorage.setItem('notebook_theme', theme)
    localStorage.setItem('notebook_accent', accentColor)
  }, [theme, accentColor])

  useEffect(() => {
    if (token) {
      Promise.all([fetchNotes(), fetchTodos()]).then(() => setLoading(false))
    } else setLoading(false)
  }, [token])

  // --- Auto-save ---
  useEffect(() => {
    if (!activeNote || !activeNote._isDirty) return
    const timer = setTimeout(() => saveNoteToServer(activeNote), 1200)
    return () => clearTimeout(timer)
  }, [activeNote?.content, activeNote?.title, activeNote?.date])

  const saveNoteToServer = async (note) => {
    setIsSaving(true)
    try {
      const res = await fetch(`${API_URL}/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ title: note.title, content: note.content, category: note.category, isPinned: note.isPinned, date: note.date })
      })
      if (res.ok) {
        const updated = await res.json()
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
        setActiveNote(prev => prev?.id === updated.id ? { ...updated, _isDirty: false } : prev)
      }
    } catch (err) { console.error(err) }
    finally { setIsSaving(false) }
  }

  // --- API ---
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

  const handleCreateNote = async (initialDate = null) => {
    const newNote = { title: 'New Note', content: '# New Note\n\n- [ ] Task 1', category: 'General', date: initialDate ? initialDate.toISOString() : null }
    const res = await fetch(`${API_URL}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(newNote) })
    const data = await res.json()
    setNotes([data, ...notes]); setActiveNote(data); setActiveTab('notes'); setSidebarOpen(false);
  }

  const handleUpdateActiveNote = (updates) => {
    setActiveNote(prev => ({ ...prev, ...updates, _isDirty: true }))
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

  const handleExport = () => {
    if (!activeNote) return
    const blob = new Blob([activeNote.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeNote.title || 'note'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.isPinned === b.isPinned ? new Date(b.createdAt) - new Date(a.createdAt) : a.isPinned ? -1 : 1))
  }, [notes, searchQuery])

  // --- UI Components ---
  const TodoModal = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowTodos(false)}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
          <h2>Todo Manager</h2>
          <button className="btn-icon" onClick={() => setShowTodos(false)}><X size={20}/></button>
        </div>
        <form style={{display:'flex', gap:'10px', marginBottom:'1.5rem'}} onSubmit={(e) => {
          e.preventDefault(); if(!newTodoTask.trim()) return;
          fetch(`${API_URL}/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify({ task: newTodoTask }) }).then(() => { fetchTodos(); setNewTodoTask(''); })
        }}>
          <input className="search-input" placeholder="Quick task..." value={newTodoTask} onChange={e => setNewTodoTask(e.target.value)} />
          <button type="submit" className="btn-icon active" style={{width:'80px', borderRadius:'16px'}}><Plus size={20}/></button>
        </form>
        <div style={{maxHeight:'400px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'10px'}}>
          {todos.map(t => (
            <div key={t.id} className="note-item active" style={{display:'flex', alignItems:'center', gap:'12px', padding:'1rem'}}>
              <input type="checkbox" style={{width:20, height:20, accentColor:'var(--accent-color)'}} checked={t.completed} onChange={() => fetch(`${API_URL}/todos/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify({ completed: !t.completed }) }).then(() => fetchTodos())} />
              <span style={{flex:1, textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1}}>{t.task}</span>
              <Trash2 size={18} color="#ff4444" style={{cursor:'pointer'}} onClick={() => fetch(`${API_URL}/todos/${t.id}`, { method: 'DELETE', headers: { 'Authorization': token } }).then(() => fetchTodos())} />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )

  if (!token) return (
    <div className="login-container">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="login-card">
        <h1 style={{fontSize:'3rem', marginBottom:'0.5rem', fontWeight:900, letterSpacing:'-2px'}}>Notebook</h1>
        <p style={{color:'var(--text-dim)', marginBottom:'2.5rem', fontSize:'1.1rem'}}>Enter password to unlock.</p>
        <form onSubmit={handleLogin}>
          <input type="password" className="login-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          {loginError && <div style={{color:'#ff4444', marginBottom:'1rem'}}>{loginError}</div>}
          <button type="submit" className="login-btn" style={{height:'55px', fontSize:'1.1rem'}}>Unlock Pro</button>
        </form>
      </motion.div>
    </div>
  )

  return (
    <div className="app-container">
      <div className="bg-blobs">
        <div className="blob" style={{ top: '-10%', left: '10%' }} />
        <div className="blob" style={{ bottom: '10%', right: '10%', opacity: 0.3 }} />
      </div>

      <aside className={`sidebar ${sidebarOpen ? 'mobile-visible' : ''}`}>
        <div className="sidebar-header">
          <h2>Notes</h2>
          <button className="btn-icon" onClick={() => handleCreateNote()}><Plus size={20}/></button>
        </div>
        <div className="search-container">
          <input type="text" className="search-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="notes-list">
          {filteredNotes.map(n => (
            <div key={n.id} className={`note-item ${activeNote?.id === n.id ? 'active' : ''}`} onClick={() => { setActiveNote(n); setActiveTab('notes'); setSidebarOpen(false); }}>
              <div className="note-title-small">{n.isPinned && <Pin size={12} fill="var(--accent-color)" style={{marginRight:6}}/>}{n.title}</div>
              <div className="note-meta">{format(parseISO(n.createdAt), 'MMM d')} • {n.category}</div>
            </div>
          ))}
        </div>
        <div className="sidebar-footer" style={{padding:'1rem', borderTop:'1px solid var(--glass-border)', display:'flex', gap:'10px'}}>
          <button className={`btn-icon ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}><CalendarIcon size={20}/></button>
          <button className="btn-icon" onClick={() => setShowTodos(true)}><CheckSquare size={20}/></button>
          <button className={`btn-icon ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={20}/></button>
        </div>
      </aside>

      <nav className="mobile-nav">
        <button className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}><FileText size={24}/><span>Notes</span></button>
        <button className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}><CalendarIcon size={24}/><span>Plan</span></button>
        <button className="nav-item" onClick={() => setShowTodos(true)}><CheckSquare size={24}/><span>Tasks</span></button>
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Palette size={24}/><span>Style</span></button>
      </nav>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'notes' && (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <header className="editor-header">
                <button className="menu-toggle" onClick={() => setSidebarOpen(true)}><Menu size={24}/></button>
                {activeNote ? (
                  <>
                    <input className="title-input" value={activeNote.title} onChange={(e) => handleUpdateActiveNote({ title: e.target.value })} />
                    <input type="date" className="date-input-ghost" value={activeNote.date ? format(parseISO(activeNote.date), 'yyyy-MM-dd') : ''} onChange={(e) => handleUpdateActiveNote({ date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    <button className="btn-icon" onClick={handleExport} title="Export .md"><Download size={18}/></button>
                    <button className="btn-icon" onClick={() => handleUpdateActiveNote({ isPinned: !activeNote.isPinned })}>
                      <Pin size={18} fill={activeNote.isPinned ? "var(--accent-color)" : "none"} />
                    </button>
                    <button className="btn-icon" onClick={() => {if(window.confirm('Delete?')) fetch(`${API_URL}/notes/${activeNote.id}`, { method: 'DELETE', headers: { 'Authorization': token } }).then(() => fetchNotes())}}><Trash2 size={18}/></button>
                  </>
                ) : <div className="title-input">Select a note</div>}
              </header>
              <div className="editor-body">
                {activeNote ? (
                  <>
                    <div className="editor-pane"><textarea className="markdown-editor" value={activeNote.content} onChange={(e) => handleUpdateActiveNote({ content: e.target.value })} /></div>
                    <div className="preview-pane">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        input: ({ checked, ...props }) => props.type === 'checkbox' ? <input type="checkbox" checked={checked} readOnly onClick={(e) => toggleMarkdownTodo(Array.from(document.querySelectorAll('.preview-pane input[type="checkbox"]')).indexOf(e.target))} /> : <input {...props} />
                      }}>{activeNote.content}</ReactMarkdown>
                    </div>
                  </>
                ) : <div style={{flex:1, display:'flex', justifyContent:'center', alignItems:'center', opacity:0.5}}><h2>Choose a note to start.</h2></div>}
              </div>
              {activeNote && <footer className="editor-footer">
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}><div className={`save-dot ${isSaving ? 'saving' : ''}`} />{isSaving ? 'Saving...' : 'Synced'}</div>
                <div>{activeNote.content.length} characters</div>
              </footer>}
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="calendar-view">
              <div className="calendar-container">
                <Calendar onChange={setCalendarDate} value={calendarDate} tileClassName={({ date, view }) => view === 'month' && notes.find(n => n.date && isSameDay(parseISO(n.date), date)) ? 'has-notes' : ''} />
              </div>
              <div style={{padding:'2rem', width:'100%', maxWidth:'600px'}}>
                <h2 style={{marginBottom:'1rem'}}>{format(calendarDate, 'MMMM d, yyyy')}</h2>
                {notes.filter(n => n.date && isSameDay(parseISO(n.date), calendarDate)).map(n => (
                  <div key={n.id} className="note-item active" onClick={() => { setActiveNote(n); setActiveTab('notes'); }}>{n.title}</div>
                ))}
                <button className="login-btn" style={{marginTop:'1.5rem'}} onClick={() => handleCreateNote(calendarDate)}>+ New note for this day</button>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="settings-container">
              <div className="settings-card">
                <h1>Style & Account</h1>
                <div className="settings-row">
                  <span>Theme Preference</span>
                  <button className="btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
                </div>
                <div className="settings-row" style={{flexDirection:'column', alignItems:'flex-start', gap:'1.5rem'}}>
                  <span>Accent Color</span>
                  <div className="color-grid">
                    {['#7c4dff', '#ff4081', '#00e676', '#ffea00', '#00b0ff', '#ffffff'].map(c => (
                      <div key={c} className={`color-circle ${accentColor === c ? 'active' : ''}`} style={{background:c}} onClick={() => setAccentColor(c)} />
                    ))}
                  </div>
                </div>
                <button className="login-btn" style={{marginTop:'3rem', background:'rgba(255,68,68,0.1)', color:'#ff4444', border:'1px solid rgba(255,68,68,0.2)'}} onClick={handleLogout}>Sign Out</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>{showTodos && <TodoModal />}</AnimatePresence>
    </div>
  )
}

export default App
