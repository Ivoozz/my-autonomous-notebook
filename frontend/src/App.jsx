import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileLines, faCalendarDays, faSquareCheck, faPalette, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import Planner from './components/Planner'
import Tasks from './components/Tasks'
import Settings from './components/Settings'
import Auth from './components/Auth'
import Emails from './components/Emails'
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
  }, [theme, accentColor, bgBlobs])

  useEffect(() => {
    if (token) {
      Promise.all([fetchNotes(), fetchTodos()]).then(() => setLoading(false))
    } else setLoading(false)
  }, [token])

  useEffect(() => {
    if (!activeNote || !activeNote._isDirty) return
    const timer = setTimeout(() => saveNoteToServer(activeNote), 1200)
    return () => clearTimeout(timer)
  }, [activeNote?.content, activeNote?.title, activeNote?.category, activeNote?.isPinned, activeNote?.date])

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
    } finally { setIsSaving(false) }
  }

  const handleCreateNote = async (initialDate = null) => {
    let dateStr = null;
    if (initialDate) {
      const tzOffset = initialDate.getTimezoneOffset() * 60000;
      dateStr = (new Date(initialDate.getTime() - tzOffset)).toISOString().split('T')[0];
    }
    const newNote = { title: 'New Note', content: '# New Note', category: 'General', date: dateStr }
    const res = await fetch(`${API_URL}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(newNote) })
    const data = await res.json()
    setNotes([data, ...notes]); setActiveNote(data); setActiveTab('notes'); setSidebarOpen(false);
  }

  const handleUpdateActiveNote = (updates) => {
    setActiveNote(prev => ({ ...prev, ...updates, _isDirty: true }))
  }

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return
    await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE', headers: { 'Authorization': token } })
    setNotes(prev => prev.filter(n => n.id !== id))
    setActiveNote(null)
  }

  const toggleMarkdownTodo = (index) => {
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

  if (!token) return <Auth password={password} setPassword={setPassword} handleLogin={handleLogin} loginError={loginError} />
  if (loading) return <div className="app-container" style={{justifyContent:'center', alignItems:'center'}}>Loading...</div>

  return (
    <div className="app-container">
      {bgBlobs && (
        <div className="bg-blobs">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
      )}

      <Sidebar 
        notebookTitle={notebookTitle} 
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
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <FontAwesomeIcon icon={faPalette, faEnvelope} style={{fontSize:'1.4rem'}} />
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
              handleDeleteTodo={(id) => fetch(`${API_URL}/todos/${id}`, { method: 'DELETE', headers: { 'Authorization': token } }).then(() => fetchTodos())}
            />
          )}
                    {activeTab === 'emails' && (
            <Emails token={token} handleAddTodo={(newTaskObj) => {
                fetch(`${API_URL}/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token }, body: JSON.stringify(newTaskObj) }).then(() => fetchTodos())
              }} 
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
    </div>
  )
}

export default App
