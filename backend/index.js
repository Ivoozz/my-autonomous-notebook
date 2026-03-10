const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const CONFIG_FILE = path.join(__dirname, 'config.json');

app.use(helmet());
app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api/', apiLimiter);

// --- Config Management ---
let config = {
  hashedPassword: '',
  validToken: process.env.VALID_TOKEN || 'secret-token-123'
};

const loadConfig = () => {
  if (fs.existsSync(CONFIG_FILE)) {
    const data = fs.readFileSync(CONFIG_FILE);
    config = { ...config, ...JSON.parse(data) };
  } else {
    // Initial setup from .env or default
    const plainPassword = process.env.AUTH_PASSWORD || 'password123';
    config.hashedPassword = bcrypt.hashSync(plainPassword, 10);
    saveConfig();
  }
};

const saveConfig = () => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
};

loadConfig();

const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token === config.validToken) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/api/login', authLimiter, (req, res) => {
  const { password } = req.body;
  if (bcrypt.compareSync(password, config.hashedPassword)) {
    res.json({ token: config.validToken });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.post('/api/admin/change-password', authenticate, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old and new passwords are required' });
  }

  if (bcrypt.compareSync(oldPassword, config.hashedPassword)) {
    config.hashedPassword = bcrypt.hashSync(newPassword, 10);
    saveConfig();
    res.json({ message: 'Password changed successfully' });
  } else {
    res.status(400).json({ error: 'Incorrect current password' });
  }
});

// In-memory arrays for storage
let todos = [];
let nextTodoId = 1;

let passwords = [];
let nextPasswordId = 1;

// --- PASSWORD Endpoints (Protected) ---
app.get('/api/passwords', authenticate, (req, res) => {
  res.json(passwords);
});

app.post('/api/passwords', authenticate, (req, res) => {
  const { title, username, encryptedData } = req.body;
  if (!title || !encryptedData) return res.status(400).json({ error: 'Title and encryptedData are required' });

  const newPassword = { id: nextPasswordId++, title, username: username || '', encryptedData, createdAt: new Date().toISOString() };
  passwords.push(newPassword);
  res.status(201).json(newPassword);
});

app.put('/api/passwords/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { title, username, encryptedData } = req.body;
  const pwd = passwords.find(p => p.id === parseInt(id));
  if (!pwd) return res.status(404).json({ error: 'Password entry not found' });
  
  if (title !== undefined) pwd.title = title;
  if (username !== undefined) pwd.username = username;
  if (encryptedData !== undefined) pwd.encryptedData = encryptedData;
  pwd.updatedAt = new Date().toISOString();
  
  res.json(pwd);
});

app.delete('/api/passwords/:id', authenticate, (req, res) => {
  const { id } = req.params;
  passwords = passwords.filter(p => p.id !== parseInt(id));
  res.status(204).send();
});

let notes = [
  {
    id: 1,
    title: '🚀 Welcome to Notebook Pro',
    content: `# Welcome to Notebook Pro

This is your ultimate workspace for notes, planning, and communication.

### ⌨️ Global Shortcuts
- **Ctrl + N**: New Note
- **Ctrl + S**: Manual Sync
- **Ctrl + P**: Toggle Pin
- **Ctrl + F**: Focus Search
- **Delete**: Delete Active Note
- **Ctrl + Alt + 1-5**: Switch Tabs

### ✍️ Editor Shortcuts
- **Ctrl + B**: Bold text
- **Ctrl + I**: Italicize text
- **Ctrl + E**: Inline code
- **Ctrl + K**: Insert link

### 📝 Markdown Guide
- **# Header 1** to **###### Header 6**
- **Bold**: **text**
- *Italic*: *text*
- \`Inline Code\`
- [Link](url)
- - [ ] Task List
- > Blockquotes

### 📂 Folders & Organization
- Group your notes by adding a **Folder** name in the editor.
- Use the **Filter** icon in the sidebar to sort.

### 📧 Email & Integration
- Configure **IMAP/SMTP** in Settings.
- Export emails to **Tasks** or **Notes**!`,
    category: 'Guide',
    folder: 'Onboarding',
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
  const { task, dueDate, priority, status } = req.body;
  if (!task) return res.status(400).json({ error: 'Task is required' });

  const newTodo = { id: nextTodoId++, task, completed: false, dueDate: dueDate || null, priority: priority || 'Medium', status: status || 'todo' };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.put('/api/todos/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { task, completed, dueDate, priority, status } = req.body;
  const todo = todos.find(t => t.id === parseInt(id));
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  if (typeof completed === 'boolean') todo.completed = completed;
  if (task !== undefined) todo.task = task;
  if (dueDate !== undefined) todo.dueDate = dueDate;
  if (priority !== undefined) todo.priority = priority;
  if (status !== undefined) todo.status = status;
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
  const { title, content, category, folder, isPinned, date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const newNote = {
    id: nextNoteId++,
    title,
    content: content || '',
    category: category || 'General',
    folder: folder || 'Uncategorized',
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
  const { title, content, category, folder, isPinned, date } = req.body;
  const noteIndex = notes.findIndex(n => n.id === parseInt(id));

  if (noteIndex === -1) return res.status(404).json({ error: 'Note not found' });

  notes[noteIndex] = {
    ...notes[noteIndex],
    title: title || notes[noteIndex].title,
    content: content !== undefined ? content : notes[noteIndex].content,
    category: category !== undefined ? category : notes[noteIndex].category,
    folder: folder !== undefined ? folder : notes[noteIndex].folder,
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

// Admin IMAP/SMTP Settings (In-memory)
let adminSettings = {
  imapHost: '',
  imapPort: 993,
  imapUser: '',
  imapPass: '',
  imapTls: true,
  smtpHost: '',
  smtpPort: 465,
  smtpUser: '',
  smtpPass: '',
  smtpTls: true
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
                to: parsed.to ? parsed.to.text : '',
                date: message.internalDate || message.envelope.date,
                snippet: parsed.text ? parsed.text.substring(0, 300).replace(/\\s+/g, ' ').trim() : '',
                body: parsed.text || '',
                messageId: parsed.messageId,
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

app.post('/api/emails/send', authenticate, async (req, res) => {
  const { to, subject, text, inReplyTo, references } = req.body;
  if (!adminSettings.smtpHost || !adminSettings.smtpUser || !adminSettings.smtpPass) {
    return res.status(400).json({ error: 'SMTP settings are not configured.' });
  }

  const transporter = nodemailer.createTransport({
    host: adminSettings.smtpHost,
    port: parseInt(adminSettings.smtpPort) || 465,
    secure: adminSettings.smtpTls !== false,
    auth: {
      user: adminSettings.smtpUser,
      pass: adminSettings.smtpPass
    }
  });

  try {
    await transporter.sendMail({
      from: adminSettings.smtpUser,
      to,
      subject,
      text,
      inReplyTo,
      references
    });
    res.json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('SMTP Error:', error);
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
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
