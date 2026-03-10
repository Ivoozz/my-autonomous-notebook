import React from 'react';
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import { format, isSameDay, parseISO } from 'date-fns';

const Planner = ({ calendarDate, setCalendarDate, notes, onNoteClick, onCreateNote }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="calendar-view">
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
        <h2 style={{marginBottom:'1rem'}}>{format(calendarDate, 'MMMM d, yyyy')}</h2>
        {notes.filter(n => n.date && isSameDay(parseISO(n.date), calendarDate)).map(n => (
          <div key={n.id} className="note-item active" onClick={() => onNoteClick(n)}>
            {n.title}
          </div>
        ))}
        <button className="login-btn" style={{marginTop:'1rem'}} onClick={() => onCreateNote(calendarDate)}>
          + New note for this day
        </button>
      </div>
    </motion.div>
  );
};

export default Planner;
