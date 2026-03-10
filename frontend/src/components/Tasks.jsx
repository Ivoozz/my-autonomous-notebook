import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faPlus, faCalendar, faFlag } from '@fortawesome/free-solid-svg-icons';

const Tasks = ({ todos, handleAddTodo, handleToggleTodo, handleDeleteTodo }) => {
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');

  const onSubmit = (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    handleAddTodo({ task, dueDate, priority });
    setTask('');
    setDueDate('');
    setPriority('Medium');
  };

  const priorityColors = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#10b981'
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-container">
      <div className="settings-card">
        <h2>Quick Tasks</h2>
        <form style={{display:'flex', gap:'10px', margin:'1.5rem 0', flexWrap: 'wrap'}} onSubmit={onSubmit}>
          <input 
            className="search-input" 
            style={{background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', flex: 1, minWidth: '200px'}} 
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
          <button type="submit" className="login-btn" style={{width:'80px', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </form>
        <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
          {todos.sort((a, b) => {
            const p = { High: 3, Medium: 2, Low: 1 };
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return (p[b.priority || 'Medium'] || 0) - (p[a.priority || 'Medium'] || 0);
          }).map(t => (
            <div key={t.id} className="note-item" style={{display:'flex', alignItems:'center', gap:'12px', padding:'0.8rem', background:'rgba(255,255,255,0.02)'}}>
              <input 
                type="checkbox" 
                style={{width:20, height:20}} 
                checked={t.completed} 
                onChange={() => handleToggleTodo(t)} 
              />
              <div style={{flex:1, display:'flex', flexDirection:'column'}}>
                <span style={{fontSize:'1rem', textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1}}>
                  {t.task}
                </span>
                <div style={{display:'flex', gap:'10px', marginTop:'4px', fontSize:'0.75rem', opacity: t.completed ? 0.4 : 0.8}}>
                  {t.dueDate && <span><FontAwesomeIcon icon={faCalendar} style={{marginRight:'4px'}}/>{t.dueDate}</span>}
                  {t.priority && <span><FontAwesomeIcon icon={faFlag} color={priorityColors[t.priority]} style={{marginRight:'4px'}}/>{t.priority}</span>}
                </div>
              </div>
              <button 
                onClick={() => handleDeleteTodo(t.id)}
                style={{background:'transparent', border:'none', cursor:'pointer', padding:'5px'}}
              >
                <FontAwesomeIcon icon={faTrashCan} color="#ff4444" />
              </button>
            </div>
          ))}
          {todos.length === 0 && <p style={{textAlign:'center', opacity:0.5, marginTop:'2rem'}}>No tasks yet.</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default Tasks;
