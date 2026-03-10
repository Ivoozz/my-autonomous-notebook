import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

const Tasks = ({ todos, newTodoTask, setNewTodoTask, handleAddTodo, handleToggleTodo, handleDeleteTodo }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-container">
      <div className="settings-card">
        <h2>Quick Tasks</h2>
        <form style={{display:'flex', gap:'10px', margin:'1.5rem 0'}} onSubmit={handleAddTodo}>
          <input 
            className="search-input" 
            style={{background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)'}} 
            placeholder="What needs to be done?" 
            value={newTodoTask} 
            onChange={e => setNewTodoTask(e.target.value)} 
          />
          <button type="submit" className="login-btn" style={{width:'80px'}}>Add</button>
        </form>
        <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
          {todos.map(t => (
            <div key={t.id} className="note-item" style={{display:'flex', alignItems:'center', gap:'12px', padding:'0.8rem', background:'rgba(255,255,255,0.02)'}}>
              <input 
                type="checkbox" 
                style={{width:20, height:20}} 
                checked={t.completed} 
                onChange={() => handleToggleTodo(t)} 
              />
              <span style={{flex:1, fontSize:'1rem', textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1}}>
                {t.task}
              </span>
              <Trash2 
                size={18} 
                color="#ff4444" 
                style={{cursor:'pointer'}} 
                onClick={() => handleDeleteTodo(t.id)} 
              />
            </div>
          ))}
          {todos.length === 0 && <p style={{textAlign:'center', opacity:0.5, marginTop:'2rem'}}>No tasks yet.</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default Tasks;
