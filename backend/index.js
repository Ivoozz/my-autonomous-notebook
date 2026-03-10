const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// --- Simple Auth ---
const AUTH_PASSWORD = 'password123'; // User can change this later
const VALID_TOKEN = 'secret-token-123';

const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token === VALID_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === AUTH_PASSWORD) {
    res.json({ token: VALID_TOKEN });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// In-memory arrays for storage
let todos = [];
let nextTodoId = 1;

let notes = [
  {
    id: 1,
    title: 'Welcome to your Notebook',
    content: '# Hello World\n\nThis is your first note. You can use **Markdown** here!',
    category: 'General',
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
let nextNoteId = 2;

// --- TODO Endpoints (Protected) ---
app.get('/api/todos', authenticate, (req, res) => {
  res.json(todos);
});

app.post('/api/todos', authenticate, (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: 'Task is required' });

  const newTodo = { id: nextTodoId++, task, completed: false };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.put('/api/todos/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const todo = todos.find(t => t.id === parseInt(id));
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  if (typeof completed === 'boolean') todo.completed = completed;
  res.json(todo);
});

app.delete('/api/todos/:id', authenticate, (req, res) => {
  const { id } = req.params;
  todos = todos.filter(t => t.id !== parseInt(id));
  res.status(204).send();
});

// --- NOTE Endpoints (Protected) ---
app.get('/api/notes', authenticate, (req, res) => {
  res.json(notes);
});

app.post('/api/notes', authenticate, (req, res) => {
  const { title, content, category, isPinned, date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const newNote = {
    id: nextNoteId++,
    title,
    content: content || '',
    category: category || 'General',
    isPinned: isPinned || false,
    date: date || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  notes.push(newNote);
  res.status(201).json(newNote);
});

app.put('/api/notes/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { title, content, category, isPinned, date } = req.body;
  const noteIndex = notes.findIndex(n => n.id === parseInt(id));

  if (noteIndex === -1) return res.status(404).json({ error: 'Note not found' });

  notes[noteIndex] = {
    ...notes[noteIndex],
    title: title || notes[noteIndex].title,
    content: content !== undefined ? content : notes[noteIndex].content,
    category: category || notes[noteIndex].category,
    isPinned: isPinned !== undefined ? isPinned : notes[noteIndex].isPinned,
    date: date !== undefined ? date : notes[noteIndex].date,
    updatedAt: new Date().toISOString()
  };

  res.json(notes[noteIndex]);
});

app.delete('/api/notes/:id', authenticate, (req, res) => {
  const { id } = req.params;
  notes = notes.filter(n => n.id !== parseInt(id));
  res.status(204).send();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
