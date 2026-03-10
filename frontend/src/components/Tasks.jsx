import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faPlus, faCalendar, faFlag, faList, faColumns } from '@fortawesome/free-solid-svg-icons';

const Tasks = ({ todos, handleAddTodo, handleToggleTodo, handleDeleteTodo, handleUpdateTodo }) => {
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [viewMode, setViewMode] = useState('list');

  const onSubmit = (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    handleAddTodo({ task, dueDate, priority, status: 'todo' });
    setTask('');
    setDueDate('');
    setPriority('Medium');
  };

  const priorityColors = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#10b981'
  };

  const renderTaskCard = (t) => (
    <motion.div layout key={t.id} className="note-item" style={{display:'flex', alignItems:'center', gap:'12px', padding:'0.8rem', background:'rgba(255,255,255,0.02)', margin:'0 0 8px 0'}}>
      <input 
        type="checkbox" 
        style={{width:20, height:20}} 
        checked={t.completed} 
        onChange={() => handleToggleTodo(t)} 
      />
      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <span style={{fontSize:'1rem', textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
          {t.task}
        </span>
        <div style={{display:'flex', gap:'10px', marginTop:'4px', fontSize:'0.75rem', opacity: t.completed ? 0.4 : 0.8, flexWrap:'wrap'}}>
          {t.dueDate && <span><FontAwesomeIcon icon={faCalendar} style={{marginRight:'4px'}}/>{t.dueDate}</span>}
          {t.priority && <span><FontAwesomeIcon icon={faFlag} color={priorityColors[t.priority]} style={{marginRight:'4px'}}/>{t.priority}</span>}
          {viewMode === 'kanban' && handleUpdateTodo && (
            <select 
              value={t.status || 'todo'} 
              onChange={e => handleUpdateTodo(t.id, { status: e.target.value })}
              style={{background:'transparent', border:'none', color:'var(--text-color)', opacity:0.8, cursor:'pointer', fontSize:'0.75rem'}}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          )}
        </div>
      </div>
      <button 
        onClick={() => handleDeleteTodo(t.id)}
        style={{background:'transparent', border:'none', cursor:'pointer', padding:'5px'}}
      >
        <FontAwesomeIcon icon={faTrashCan} color="#ff4444" />
      </button>
    </motion.div>
  );

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-container">
      <div className="settings-card" style={{width: '100%', maxWidth: '1400px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2>Quick Tasks</h2>
          <div style={{display:'flex', gap:'10px'}}>
            <button className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List View">
              <FontAwesomeIcon icon={faList} />
            </button>
            <button className={`btn-icon ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')} title="Kanban Board">
              <FontAwesomeIcon icon={faColumns} />
            </button>
          </div>
        </div>
        
        <form style={{display:'flex', gap:'10px', margin:'1.5rem 0', flexWrap: 'wrap'}} onSubmit={onSubmit}>
          <input 
            className="standard-input" 
            style={{flex: 1, minWidth: '200px', paddingLeft: '1.2rem'}} 
            placeholder="What needs to be done?" 
            value={task} 
            onChange={e => setTask(e.target.value)} 
          />
          <input 
            type="date"
            className="date-input-ghost"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
          <select 
            className="date-input-ghost" 
            value={priority} 
            onChange={e => setPriority(e.target.value)}
            style={{appearance: 'auto'}}
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <button type="submit" className="login-btn" style={{width:'80px', height:'42px', display:'flex', alignItems:'center', justifyContent:'center', padding:0}}>
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </form>

        {viewMode === 'list' ? (
          <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
            {todos.sort((a, b) => {
              const p = { High: 3, Medium: 2, Low: 1 };
              if (a.completed !== b.completed) return a.completed ? 1 : -1;
              return (p[b.priority || 'Medium'] || 0) - (p[a.priority || 'Medium'] || 0);
            }).map(renderTaskCard)}
            {todos.length === 0 && <p style={{textAlign:'center', opacity:0.5, marginTop:'2rem'}}>No tasks yet.</p>}
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'20px', alignItems:'flex-start'}}>
            {columns.map(col => (
              <div key={col.id} className="glass-panel" style={{padding:'1.5rem', borderRadius:'var(--radius-md)'}}>
                <h3 style={{marginBottom:'1.5rem', fontSize:'1.1rem', fontWeight:800, color:'var(--accent-color)'}}>{col.title}</h3>
                <AnimatePresence>
                  {todos.filter(t => (t.status || 'todo') === col.id).map(renderTaskCard)}
                </AnimatePresence>
                {todos.filter(t => (t.status || 'todo') === col.id).length === 0 && <div style={{opacity:0.4, fontSize:'0.9rem', textAlign:'center', padding:'1rem'}}>Empty</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Tasks;
