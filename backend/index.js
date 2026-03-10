const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// In-memory array for todos
let todos = [];
let nextId = 1;

// GET /api/todos (list all todos)
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// POST /api/todos (create a new todo)
app.post('/api/todos', (req, res) => {
  const { task } = req.body;
  
  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }

  const newTodo = {
    id: nextId++,
    task,
    completed: false
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// PUT /api/todos/:id (update a todo's status)
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const todo = todos.find(t => t.id === parseInt(id));

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  if (typeof completed === 'boolean') {
    todo.completed = completed;
  }

  res.json(todo);
});

// DELETE /api/todos/:id (delete a todo)
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = todos.length;
  todos = todos.filter(t => t.id !== parseInt(id));

  if (todos.length === initialLength) {
    return res.status(404).json({ error: 'Todo not found' });
  }

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
