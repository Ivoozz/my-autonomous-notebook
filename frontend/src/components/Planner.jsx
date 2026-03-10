import React from 'react';
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const Planner = ({ calendarDate, setCalendarDate, notes, onNoteClick, onCreateNote }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="calendar-view" style={{height:'100%', overflowY:'auto'}}>
      <div className="calendar-container">
        <Calendar 
          onChange={setCalendarDate} 
          value={calendarDate} 
          tileClassName={({ date, view }) => 
            view === 'month' && notes.find(n => n.date && isSameDay(parseISO(n.date), date)) ? 'has-notes' : ''
          } 
        />
      </div>
      <div className="day-notes-list" style={{padding:'1.5rem', width:'100%', maxWidth:'600px'}}>
        <h2 style={{marginBottom:'1rem', fontWeight:800}}>{format(calendarDate, 'MMMM d, yyyy')}</h2>
        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          {notes.filter(n => n.date && isSameDay(parseISO(n.date), calendarDate)).map(n => (
            <div key={n.id} className="note-item active" style={{margin:0}} onClick={() => onNoteClick(n)}>
              {n.title || 'Untitled'}
            </div>
          ))}
        </div>
        <button className="login-btn" style={{marginTop:'1.5rem', gap:'10px'}} onClick={() => onCreateNote(calendarDate)}>
          <FontAwesomeIcon icon={faPlus} />
          <span>New note for this day</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Planner;
