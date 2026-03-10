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

// No changes needed to backend for real-time localStorage settings,
// but ensuring the /api/login and /api/notes remain robust.
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
    title: '🚀 Welcome to Notebook Pro',
    content: '# Welcome to your New Notebook!\n\nThis app is designed for speed, beauty, and organization.\n\n### 📝 Markdown Guide\nYou can use standard Markdown to style your notes:\n- **Bold** or *Italic* text\n- # Headers (H1 to H6)\n- [Links](https://google.com)\n- `Inline code` and code blocks\n- > Blockquotes\n\n### 💡 Key Features\n1. **Glassmorphism UI**: High-end modern design with blur effects.\n2. **Auto-save**: Your notes save automatically as you type.\n3. **Calendar**: Associate notes with specific dates for planning.\n4. **Todo Manager**: Keep track of tasks in the dedicated modal.\n5. **Export**: Save your notes as `.md` files anytime.\n6. **Pins**: Keep your most important notes at the top.\n\n### ⌨️ Quick Tips\n- Use the **Search** bar to find notes instantly.\n- Toggle **Dark/Light** mode in the Settings page.\n- Use the **Hamburger Menu** on mobile to navigate.',
    category: 'Guide',
    isPinned: true,
    date: new Date().toISOString(),
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
  const { task, dueDate, priority } = req.body;
  if (!task) return res.status(400).json({ error: 'Task is required' });

  const newTodo = { id: nextTodoId++, task, completed: false, dueDate: dueDate || null, priority: priority || 'Medium' };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.put('/api/todos/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { task, completed, dueDate, priority } = req.body;
  const todo = todos.find(t => t.id === parseInt(id));
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  if (typeof completed === 'boolean') todo.completed = completed;
  if (task !== undefined) todo.task = task;
  if (dueDate !== undefined) todo.dueDate = dueDate;
  if (priority !== undefined) todo.priority = priority;
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
