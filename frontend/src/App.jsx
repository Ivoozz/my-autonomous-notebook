import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'

const API_URL = 'http://localhost:5000/api/notes'

function App() {
  const [notes, setNotes] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await fetch(API_URL)
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

  const handleCreateNote = async () => {
    try {
      const newNote = {
        title: 'New Note',
        content: '# New Note\n\nStart writing...',
        category: 'General'
      }
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote)
      })
      const data = await response.json()
      setNotes([data, ...notes])
      setActiveNote(data)
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
      await fetch(`${API_URL}/${activeNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const handleDeleteNote = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      const updatedNotes = notes.filter(n => n.id !== id)
      setNotes(updatedNotes)
      if (activeNote && activeNote.id === id) {
        setActiveNote(updatedNotes[0] || null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  if (loading) return <div className="app-container">Loading...</div>

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Notebook</h2>
          <button onClick={handleCreateNote} className="new-note-btn">+ New</button>
        </div>
        <div className="notes-list">
          {notes.map(note => (
            <div 
              key={note.id} 
              className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
              onClick={() => setActiveNote(note)}
            >
              <div className="note-title-small">{note.title || 'Untitled'}</div>
              <div className="note-meta">{note.category} • {new Date(note.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="main-content">
        {activeNote ? (
          <>
            <div className="editor-header">
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
            </div>
            <div className="editor-body">
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
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <h3>Select or create a note to begin.</h3>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
