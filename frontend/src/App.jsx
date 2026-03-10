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
  Trash2, Menu, X, ArrowLeft, ListChecks, FileText, Palette, Save
} from 'lucide-react'
import './App.css'

const API_URL = '/api'

function App() {
  // --- Auth & Core States ---
  const [token, setToken] = useState(localStorage.getItem('notebook_token') || '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [activeTab, setActiveTab] = useState('notes') // 'notes', 'calendar', 'todos', 'settings'
  
  // --- UI States ---
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('notebook_theme') || 'dark')
  const [accentColor, setAccentColor] = useState(localStorage.getItem('notebook_accent') || '#7c4dff')
  const [isSaving, setIsSaving] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const [todos, setTodos] = useState([])
  const [newTodoTask, setNewTodoTask] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())

  const textareaRef = useRef(null)

  // --- Theme Sync ---
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : ''
    document.documentElement.style.setProperty('--accent-color', accentColor)
    localStorage.setItem('notebook_theme', theme)
    localStorage.setItem('notebook_accent', accentColor)
  }, [theme, accentColor])

  // --- Data Fetching ---
  useEffect(() => {
    if (token) {
      const init = async () => {
        await Promise.all([fetchNotes(), fetchTodos()])
        setLoading(false)
      }
      init()
    } else {
      setLoading(false)
    }
  }, [token])

  // --- Stable Auto-save Logic ---
  // We only trigger save if the note is "dirty"
  useEffect(() => {
    if (!activeNote || !activeNote._isDirty) return

    const delayDebounceFn = setTimeout(() => {
      saveNoteToServer(activeNote)
    }, 1500) // Slightly longer debounce for stability

    return () => clearTimeout(delayDebounceFn)
  }, [activeNote?.content, activeNote?.title])

  const saveNoteToServer = async (note) => {
    setIsSaving(true)
    try {
      const res = await fetch(`${API_URL}/notes/${note.id}`, {
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
      if (res.ok) {
        const updated = await res.json()
        // Sync back to global list only AFTER save to prevent render loops while typing
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
        setActiveNote(prev => prev?.id === updated.id ? { ...updated, _isDirty: false } : prev)
      }
    } catch (err) {
      console.error('Save failed', err)
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
    } catch (err) { console.error(err) }
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
      const res = await fetch(`${API_URL}/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ password }) 
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.token)
        localStorage.setItem('notebook_token', data.token)
      } else {
        setLoginError(data.error)
      }
    } catch (err) { setLoginError('Server error') }
  }

  const handleLogout = () => {
    setToken('')
    localStorage.clear()
    setNotes([])
    setActiveNote(null)
    setActiveTab('notes')
  }

  const handleCreateNote = async (initialDate = null) => {
    try {
      const newNote = { 
        title: 'New Note', 
        content: '# New Note\n\n- [ ] Task 1', 
        category: 'General', 
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
      setActiveTab('notes')
      setSidebarOpen(false)
    } catch (err) { console.error(err) }
  }

  const handleUpdateActiveNote = (updates) => {
    // IMPORTANT: Update local state immediately for fast typing
    // Do NOT update the global 'notes' list here to prevent expensive re-renders
    setActiveNote(prev => ({ ...prev, ...updates, _isDirty: true }))
  }

  const toggleMarkdownTodo = (index) => {
    if (!activeNote) return
    const lines = activeNote.content.split('\n')
    let taskCount = 0
    const newLines = lines.map(line => {
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        if (taskCount === index) {
          taskCount++
          return line.includes('[ ]') ? line.replace('[ ]', '[x]') : line.replace('[x]', '[ ]')
        }
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
        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
        {activeNote ? (
          <>
            <input 
              className="title-input" 
              value={activeNote.title} 
              onChange={(e) => handleUpdateActiveNote({ title: e.target.value })} 
            />
            <button className="btn-icon" onClick={() => handleUpdateActiveNote({ isPinned: !activeNote.isPinned })}>
              <Pin size={18} fill={activeNote.isPinned ? "var(--accent-color)" : "none"} />
            </button>
            <button className="btn-icon" onClick={() => { 
              if(window.confirm('Delete note?')) {
                fetch(`${API_URL}/notes/${activeNote.id}`, { method: 'DELETE', headers: { 'Authorization': token } })
                .then(() => {
                  setNotes(prev => prev.filter(n => n.id !== activeNote.id))
                  setActiveNote(null)
                })
              }
            }}><Trash2 size={18} /></button>
          </>
        ) : <div className="title-input">Select a Note</div>}
      </header>
      <div className="editor-body">
        {activeNote ? (
          <>
            <div className="editor-pane">
              <textarea 
                ref={textareaRef} 
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
            {isSaving ? 'Saving...' : 'All changes synced'}
          </div>
          <div>{activeNote.content?.length || 0} characters</div>
        </footer>
      )}
    </motion.div>
  )

  if (!token) return (
    <div className="login-container">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="login-card">
        <h1 style={{fontSize:'2.5rem', marginBottom:'1rem'}}>Notebook Pro</h1>
        <p style={{color:'var(--text-dim)', marginBottom:'2rem'}}>Unlock your private digital garden.</p>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            className="login-input" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            autoFocus 
          />
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
        <div className="blob" style={{ bottom: '10%', right: '10%', background: '#ff4081', opacity: 0.4 }} />
      </div>

      {/* --- Unified Navigation Sidebar --- */}
      <aside className={`sidebar ${sidebarOpen ? 'mobile-visible' : ''}`}>
        <div className="sidebar-header">
          <h2>Notebook</h2>
          <button className="btn-icon mobile-only" onClick={() => setSidebarOpen(false)}><X size={20}/></button>
        </div>

        {/* Tab Switcher (Visible on Desktop) */}
        <div style={{display:'flex', padding:'0 1.5rem 1rem', gap:'10px'}}>
          <button className={`btn-icon ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')} title="Notes"><FileText size={18}/></button>
          <button className={`btn-icon ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')} title="Calendar"><CalendarIcon size={18}/></button>
          <button className={`btn-icon ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')} title="Tasks"><CheckSquare size={18}/></button>
          <button className={`btn-icon ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} title="Settings"><Palette size={18}/></button>
        </div>

        <div className="search-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search notes..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>

        <div className="notes-list">
          {filteredNotes.map(n => (
            <div 
              key={n.id} 
              className={`note-item ${activeNote?.id === n.id ? 'active' : ''}`} 
              onClick={() => { setActiveNote(n); setActiveTab('notes'); setSidebarOpen(false); }}
            >
              <div className="note-title-small">
                {n.isPinned && <Pin size={12} fill="var(--accent-color)" style={{marginRight:6}}/>}
                {n.title}
              </div>
              <div className="note-meta">{format(parseISO(n.createdAt), 'MMM d')}</div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="login-btn" style={{padding:'0.6rem'}} onClick={() => handleCreateNote()}>
            <Plus size={18} style={{marginRight:8}}/> New Note
          </button>
        </div>
      </aside>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="mobile-nav">
        <button className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}><FileText size={24}/><span>Notes</span></button>
        <button className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}><CalendarIcon size={24}/><span>Calendar</span></button>
        <button className={`nav-item ${activeTab === 'todos' ? 'active' : ''}`} onClick={() => setActiveTab('todos')}><CheckSquare size={24}/><span>Tasks</span></button>
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Palette size={24}/><span>Style</span></button>
      </nav>

      {/* --- Main Content --- */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'notes' && <EditorView key="editor" />}
          
          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="calendar-view">
              <div className="calendar-container">
                <Calendar 
                  onChange={setCalendarDate} 
                  value={calendarDate} 
                  tileClassName={({ date, view }) => view === 'month' && notes.find(n => n.date && isSameDay(parseISO(n.date), date)) ? 'has-notes' : ''} 
                />
              </div>
              <div className="day-notes-list" style={{padding:'1.5rem', width:'100%', maxWidth:'600px'}}>
                <h2 style={{marginBottom:'1rem'}}>{format(calendarDate, 'MMMM d, yyyy')}</h2>
                {notes.filter(n => n.date && isSameDay(parseISO(n.date), calendarDate)).map(n => (
                  <div key={n.id} className="note-item active" onClick={() => { setActiveNote(n); setActiveTab('notes'); }}>
                    {n.title}
                  </div>
                ))}
                <button className="login-btn" style={{marginTop:'1rem'}} onClick={() => handleCreateNote(calendarDate)}>+ New note for this day</button>
              </div>
            </motion.div>
          )}

          {activeTab === 'todos' && (
            <motion.div key="todos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-container">
              <div className="settings-card">
                <h2>Quick Tasks</h2>
                <form style={{display:'flex', gap:'10px', margin:'1.5rem 0'}} onSubmit={(e) => {
                  e.preventDefault();
                  if(!newTodoTask.trim()) return;
                  fetch(`${API_URL}/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify({ task: newTodoTask }) })
                  .then(() => { fetchTodos(); setNewTodoTask(''); })
                }}>
                  <input className="login-input" style={{marginBottom:0}} placeholder="What needs to be done?" value={newTodoTask} onChange={e => setNewTodoTask(e.target.value)} />
                  <button type="submit" className="login-btn" style={{width:'80px'}}>Add</button>
                </form>
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {todos.map(t => (
                    <div key={t.id} className="note-item" style={{display:'flex', alignItems:'center', gap:'12px', padding:'0.8rem'}}>
                      <input type="checkbox" style={{width:20, height:20}} checked={t.completed} onChange={() => fetch(`${API_URL}/todos/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify({ completed: !t.completed }) }).then(() => fetchTodos())} />
                      <span style={{flex:1, fontSize:'1rem', textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1}}>{t.task}</span>
                      <Trash2 size={18} color="#ff4444" style={{cursor:'pointer'}} onClick={() => fetch(`${API_URL}/todos/${t.id}`, { method: 'DELETE', headers: { 'Authorization': token } }).then(() => fetchTodos())} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="settings-container">
              <div className="settings-card">
                <h1 style={{marginBottom:'2rem', letterSpacing:'-1px'}}>Personalize</h1>
                <div className="settings-row">
                  <span>Theme Preference</span>
                  <button className="btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                </div>
                <div className="settings-row" style={{flexDirection:'column', alignItems:'flex-start', gap:'1rem'}}>
                  <span>System Accent Color</span>
                  <div className="color-grid">
                    {['#7c4dff', '#ff4081', '#00e676', '#ffea00', '#00b0ff', '#ffffff'].map(c => (
                      <div key={c} className={`color-circle ${accentColor === c ? 'active' : ''}`} style={{background:c}} onClick={() => setAccentColor(c)} />
                    ))}
                  </div>
                </div>
                <div style={{marginTop:'3rem'}}>
                  <button className="login-btn" style={{background:'rgba(255,68,68,0.1)', color:'#ff4444', border:'1px solid rgba(255,68,68,0.2)'}} onClick={handleLogout}>Sign Out</button>
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
