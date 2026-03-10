import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'

const API_URL = 'http://localhost:5000/api'

function App() {
  const [token, setToken] = useState(localStorage.getItem('notebook_token') || '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (token) {
      fetchNotes()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/notes`, {
        headers: { 'Authorization': token }
      })
      if (response.status === 401) {
        handleLogout()
        return
      }
      const data = await response.json()
      setNotes(data)
      if (data.length > 0 && !activeNote) {
        setActiveNote(data[0])
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching notes:', error)
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await response.json()
      if (response.ok) {
        setToken(data.token)
        localStorage.setItem('notebook_token', data.token)
        setLoginError('')
      } else {
        setLoginError(data.error)
      }
    } catch (error) {
      setLoginError('Server error')
    }
  }

  const handleLogout = () => {
    setToken('')
    localStorage.removeItem('notebook_token')
    setNotes([])
    setActiveNote(null)
  }

  const handleCreateNote = async () => {
    try {
      const newNote = {
        title: 'New Note',
        content: '# New Note\n\nStart writing...',
        category: 'General'
      }
      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(newNote)
      })
      const data = await response.json()
      setNotes([data, ...notes])
      setActiveNote(data)
      setSidebarOpen(false) // Close sidebar on mobile
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  const handleUpdateNote = async (updates) => {
    if (!activeNote) return
    const updatedNote = { ...activeNote, ...updates }
    setActiveNote(updatedNote)
    
    // Optimistic update in list
    setNotes(notes.map(n => n.id === activeNote.id ? updatedNote : n))

    try {
      await fetch(`${API_URL}/notes/${activeNote.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const handleDeleteNote = async (id) => {
    try {
      await fetch(`${API_URL}/notes/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': token }
      })
      const updatedNotes = notes.filter(n => n.id !== id)
      setNotes(updatedNotes)
      if (activeNote && activeNote.id === id) {
        setActiveNote(updatedNotes[0] || null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Notebook</h1>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              className="login-input" 
              placeholder="Enter Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
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
          <button onClick={handleCreateNote} className="new-note-btn">+ New</button>
        </div>
        <div className="notes-list">
          {notes.map(note => (
            <div 
              key={note.id} 
              className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
              onClick={() => {
                setActiveNote(note)
                setSidebarOpen(false)
              }}
            >
              <div className="note-title-small">{note.title || 'Untitled'}</div>
              <div className="note-meta">{note.category} • {new Date(note.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
        <button onClick={handleLogout} style={{ marginTop: 'auto', padding: '0.5rem', background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div className="main-content">
        <div className="editor-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
          {activeNote ? (
            <>
              <input 
                className="title-input"
                value={activeNote.title}
                onChange={(e) => handleUpdateNote({ title: e.target.value })}
                placeholder="Title"
              />
              <input 
                className="category-input"
                value={activeNote.category}
                onChange={(e) => handleUpdateNote({ category: e.target.value })}
                placeholder="Category"
              />
              <button 
                className="delete-btn"
                onClick={() => handleDeleteNote(activeNote.id)}
              >
                Delete
              </button>
            </>
          ) : (
            <div className="title-input">No note selected</div>
          )}
        </div>
        
        <div className="editor-body">
          {activeNote ? (
            <>
              <div className="editor-pane">
                <textarea 
                  className="markdown-editor"
                  value={activeNote.content}
                  onChange={(e) => handleUpdateNote({ content: e.target.value })}
                  placeholder="Start writing..."
                />
              </div>
              <div className="preview-pane">
                <ReactMarkdown>{activeNote.content}</ReactMarkdown>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
              <h3>Select or create a note to begin.</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
