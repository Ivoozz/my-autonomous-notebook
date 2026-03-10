import { useState, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { format, isSameDay, parseISO } from 'date-fns'
import './App.css'

const API_URL = '/api'

function App() {
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('notebook_token') || '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  // App State
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Features State
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [theme, setTheme] = useState(localStorage.getItem('notebook_theme') || 'dark')
  const [isSaving, setIsSaving] = useState(false)
  const [view, setView] = useState('editor') // 'editor' or 'calendar'
  
  // Todo State
  const [showTodos, setShowTodos] = useState(false)
  const [todos, setTodos] = useState([])
  const [newTodoTask, setNewTodoTask] = useState('')

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date())

  // Theme Toggle Effect
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-mode' : ''
    localStorage.setItem('notebook_theme', theme)
  }, [theme])

  // Fetch Data
  useEffect(() => {
    if (token) fetchNotes()
    else setLoading(false)
  }, [token])

  useEffect(() => {
    if (showTodos && token) fetchTodos()
  }, [showTodos, token])

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notes`, { headers: { 'Authorization': token } })
      if (res.status === 401) return handleLogout()
      const data = await res.json()
      setNotes(data)
      if (data.length > 0 && !activeNote) setActiveNote(data[0])
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const fetchTodos = async () => {
    try {
      const res = await fetch(`${API_URL}/todos`, { headers: { 'Authorization': token } })
      if (res.ok) setTodos(await res.json())
    } catch (err) { console.error(err) }
  }

  // --- Auth Handlers ---
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
  }

  // --- Note CRUD Handlers ---
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

  const handleUpdateNote = async (updates) => {
    if (!activeNote) return
    setIsSaving(true)

    const updatedNote = { ...activeNote, ...updates, updatedAt: new Date().toISOString() }
    setActiveNote(updatedNote)
    setNotes(notes.map(n => n.id === activeNote.id ? updatedNote : n))

    try {
      await fetch(`${API_URL}/notes/${activeNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(updates)
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async (id) => {
    try {
      await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE', headers: { 'Authorization': token } })
      const updatedNotes = notes.filter(n => n.id !== id)
      setNotes(updatedNotes)
      if (activeNote?.id === id) setActiveNote(updatedNotes[0] || null)
    } catch (err) { console.error(err) }
  }

  const togglePin = (e, note) => {
    e.stopPropagation()
    const isPinned = !note.isPinned
    if (activeNote?.id === note.id) handleUpdateNote({ isPinned })
    else {
      setNotes(notes.map(n => n.id === note.id ? { ...n, isPinned } : n))
      fetch(`${API_URL}/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ isPinned })
      }).catch(console.error)
    }
  }

  const downloadMarkdown = () => {
    if (!activeNote) return
    const blob = new Blob([activeNote.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeNote.title || 'note'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Todo Handlers ---
  const handleAddTodo = async (e) => {
    e.preventDefault()
    if (!newTodoTask.trim()) return
    try {
      const res = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ task: newTodoTask })
      })
      if (res.ok) {
        setTodos([...todos, await res.json()])
        setNewTodoTask('')
      }
    } catch (err) { console.error(err) }
  }

  const handleToggleTodo = async (todo) => {
    const completed = !todo.completed
    setTodos(todos.map(t => t.id === todo.id ? { ...t, completed } : t))
    await fetch(`${API_URL}/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ completed })
    }).catch(console.error)
  }

  const handleDeleteTodo = async (id) => {
    setTodos(todos.filter(t => t.id !== id))
    await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE', headers: { 'Authorization': token } }).catch(console.error)
  }

  // --- Derived Data ---
  const filteredAndSortedNotes = useMemo(() => {
    let result = [...notes]
    if (categoryFilter !== 'All') result = result.filter(n => n.category === categoryFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    }
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === 'alpha-asc') return (a.title || '').localeCompare(b.title || '')
      return 0
    })
    return result
  }, [notes, searchQuery, sortBy, categoryFilter])

  const categories = ['All', ...new Set(notes.map(n => n.category || 'General'))]

  const stats = useMemo(() => {
    if (!activeNote) return { words: 0, chars: 0 }
    const text = activeNote.content || ''
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length
    return { words, chars: text.length }
  }, [activeNote?.content])

  // Calendar Helper
  const notesOnSelectedDay = useMemo(() => {
    return notes.filter(n => n.date && isSameDay(parseISO(n.date), calendarDate))
  }, [notes, calendarDate])

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      if (notes.find(n => n.date && isSameDay(parseISO(n.date), date))) {
        return 'has-notes'
      }
    }
  }

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Notebook</h1>
          <form onSubmit={handleLogin}>
            <input type="password" className="login-input" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit" className="login-btn">Login</button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) return <div className="app-container">Loading...</div>

  return (
    <div className="app-container">
      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Notebook</h2>
          <button className="btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={() => handleCreateNote()} className="new-note-btn">+ New</button>
        </div>

        <div className="sidebar-controls">
          <input type="text" className="search-input" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <div className="filter-row">
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
              <option value="alpha-asc">A-Z</option>
            </select>
            <select className="category-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="notes-list">
          {filteredAndSortedNotes.map(note => (
            <div key={note.id} className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`} onClick={() => { setActiveNote(note); setSidebarOpen(false); setView('editor'); }}>
              <div className="note-title-small">{note.title || 'Untitled'}</div>
              <div className="note-meta">
                <span>{note.category}</span>
                {note.date && <span style={{color: 'var(--accent-color)'}}>📅 {format(parseISO(note.date), 'MMM d')}</span>}
              </div>
              <span className="pin-indicator" onClick={(e) => togglePin(e, note)}>{note.isPinned ? '📌' : '📍'}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-icon" onClick={() => setView(view === 'editor' ? 'calendar' : 'editor')} title="Toggle Calendar">
            {view === 'editor' ? '📅' : '📝'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowTodos(true)}>✓ Todos</button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="main-content">
        <div className="editor-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
          
          {view === 'calendar' ? (
            <div className="title-input">Calendar View</div>
          ) : activeNote ? (
            <>
              <input className="title-input" value={activeNote.title} onChange={(e) => handleUpdateNote({ title: e.target.value })} placeholder="Title" />
              <input className="category-input" value={activeNote.category} onChange={(e) => handleUpdateNote({ category: e.target.value })} placeholder="Category" />
              <input type="date" className="date-input" value={activeNote.date ? format(parseISO(activeNote.date), 'yyyy-MM-dd') : ''} onChange={(e) => handleUpdateNote({ date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              <button className="btn-icon" onClick={(e) => togglePin(e, activeNote)} title="Pin Note">{activeNote.isPinned ? '📌' : '📍'}</button>
              <button className="btn-icon" onClick={downloadMarkdown} title="Export">💾</button>
              <button className="btn btn-delete-todo" style={{marginLeft: 'auto'}} onClick={() => handleDeleteNote(activeNote.id)}>🗑️</button>
            </>
          ) : (
            <div className="title-input">No note selected</div>
          )}
        </div>
        
        {view === 'calendar' ? (
          <div className="calendar-view">
            <div className="calendar-container">
              <Calendar onChange={setCalendarDate} value={calendarDate} tileClassName={tileClassName} />
            </div>
            <div className="day-notes-list">
              <h3>Notes for {format(calendarDate, 'MMMM d, yyyy')}</h3>
              <div className="notes-list">
                {notesOnSelectedDay.map(note => (
                  <div key={note.id} className="note-item" onClick={() => { setActiveNote(note); setView('editor'); }}>
                    <div className="note-title-small">{note.title}</div>
                    <div className="note-meta">{note.category}</div>
                  </div>
                ))}
                {notesOnSelectedDay.length === 0 && (
                  <div style={{textAlign: 'center', padding: '2rem'}}>
                    <p style={{color: '#888'}}>No notes for this day.</p>
                    <button className="btn btn-primary" onClick={() => handleCreateNote(calendarDate)}>+ Add Note for this day</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="editor-body">
              {activeNote ? (
                <>
                  <div className="editor-pane">
                    <textarea className="markdown-editor" value={activeNote.content} onChange={(e) => handleUpdateNote({ content: e.target.value })} placeholder="Start writing..." />
                  </div>
                  <div className="preview-pane"><ReactMarkdown>{activeNote.content}</ReactMarkdown></div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                  <h3>Select or create a note to begin.</h3>
                </div>
              )}
            </div>
            {activeNote && (
              <div className="editor-footer">
                <div className="save-indicator">
                  <div className={`save-dot ${isSaving ? 'saving' : ''}`}></div>
                  {isSaving ? 'Saving...' : 'Saved'}
                </div>
                <div>{stats.words} words | {stats.chars} chars</div>
                <div>Updated: {new Date(activeNote.updatedAt || activeNote.createdAt).toLocaleString()}</div>
              </div>
            )}
          </>
        )}
      </div>

      {showTodos && (
        <div className="todo-modal-overlay" onClick={() => setShowTodos(false)}>
          <div className="todo-modal" onClick={e => e.stopPropagation()}>
            <div className="todo-header">
              <h2>My Todos</h2>
              <button className="btn-icon" onClick={() => setShowTodos(false)}>✕</button>
            </div>
            <div className="todo-body">
              <form className="todo-input-row" onSubmit={handleAddTodo}>
                <input type="text" className="todo-input" placeholder="Add a new task..." value={newTodoTask} onChange={e => setNewTodoTask(e.target.value)} />
                <button type="submit" className="btn btn-primary">Add</button>
              </form>
              <div className="todo-list">
                {todos.map(todo => (
                  <div key={todo.id} className="todo-item">
                    <input type="checkbox" checked={todo.completed} onChange={() => handleToggleTodo(todo)} />
                    <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>{todo.task}</span>
                    <button className="btn-delete-todo" onClick={() => handleDeleteTodo(todo.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
