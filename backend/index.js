const express = require('express');
const cors = require('cors');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Simple Auth ---
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'password123';
const VALID_TOKEN = process.env.VALID_TOKEN || 'secret-token-123';

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
    title: '🚀 Welcome to Notebook Pro',
    content: '# Welcome to your New Notebook!\n\nThis app is designed for speed, beauty, and organization.\n\n### ⌨️ Keyboard Shortcuts\nStay productive with these quick actions:\n- **Ctrl + N**: Create a new note instantly\n- **Ctrl + S**: Manual sync (though we auto-save!)\n- **Ctrl + P**: Toggle Pin status\n- **Ctrl + F**: Focus Search bar\n- **Delete**: Remove active note\n- **Ctrl + Alt + 1-5**: Quick-switch between tabs\n\n### ✍️ Editor Shortcuts\n- **Ctrl + B**: Bold text\n- **Ctrl + I**: Italicize text\n- **Ctrl + E**: Inline code\n- **Ctrl + K**: Insert link\n\n### 💡 Key Features\n1. **Glassmorphism UI**: High-end modern design with blur effects.\n2. **IMAP Integration**: Connect your email inbox directly.\n3. **Calendar**: Associate notes with specific dates for planning.\n4. **Task Manager**: Keep track of tasks with priority and due dates.\n5. **Pomodoro**: Built-in timer for focused sessions.',
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
    category: category !== undefined ? category : notes[noteIndex].category,
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

// Admin IMAP Settings (In-memory)
let adminSettings = {
  imapHost: '',
  imapPort: 993,
  imapUser: '',
  imapPass: '',
  imapTls: true
};

app.get('/api/admin/settings', authenticate, (req, res) => {
  res.json(adminSettings);
});

app.put('/api/admin/settings', authenticate, (req, res) => {
  adminSettings = { ...adminSettings, ...req.body };
  res.json(adminSettings);
});

// --- EMAIL Endpoints (Protected) ---
app.get('/api/emails', authenticate, async (req, res) => {
  if (!adminSettings.imapHost || !adminSettings.imapUser || !adminSettings.imapPass) {
    return res.status(400).json({ error: 'IMAP settings are not configured.' });
  }

  const client = new ImapFlow({
    host: adminSettings.imapHost,
    port: parseInt(adminSettings.imapPort) || 993,
    secure: adminSettings.imapTls !== false,
    auth: {
      user: adminSettings.imapUser,
      pass: adminSettings.imapPass
    },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout: 15000
  });

  try {
    await client.connect();
    
    let emails = [];
    try {
      const lock = await client.getMailboxLock('INBOX');
      try {
        const mailbox = await client.status('INBOX', { messages: true });
        const totalMessages = mailbox.messages;
        
        if (totalMessages > 0) {
          const start = Math.max(1, totalMessages - 9);
          const range = `${start}:${totalMessages}`;

          for await (let message of client.fetch(range, { source: true, envelope: true, internalDate: true })) {
            try {
              const parsed = await simpleParser(message.source);
              emails.push({
                id: message.uid,
                subject: parsed.subject || '(No Subject)',
                from: parsed.from ? parsed.from.text : (message.envelope.from ? message.envelope.from.map(f => `${f.name} <${f.address}>`).join(', ') : 'Unknown'),
                date: message.internalDate || message.envelope.date,
                snippet: parsed.text ? parsed.text.substring(0, 200).replace(/\\s+/g, ' ').trim() : '',
                priority: parsed.headers.get('importance') || 'normal'
              });
            } catch (parseErr) {
              console.error(`Error parsing email sequence ${message.seq}:`, parseErr);
              emails.push({
                id: message.uid,
                subject: 'Error parsing email',
                from: 'Unknown',
                date: message.internalDate,
                snippet: 'Content could not be parsed.'
              });
            }
          }
        }
      } finally {
        lock.release();
      }
      
      emails.sort((a, b) => new Date(b.date) - new Date(a.date));
      res.json(emails);
      
    } finally {
      await client.logout();
    }
  } catch (error) {
    console.error('IMAP Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to fetch emails: ' + error.message });
    }
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
