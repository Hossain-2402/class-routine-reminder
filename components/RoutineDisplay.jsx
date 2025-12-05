'use client';
import { formatDate, getTodayDay } from '@/lib/helpers';
import '../styles/components.css';

export default function RoutineDisplay({ routine }) {
  if (!routine) {
    return (
      <div className="routine-display">
        <p className="no-routine">No routine uploaded yet. Upload your class routine to get started!</p>
      </div>
    );
  }

  const { routine_text, parsed_data, created_at } = routine;
  const today = getTodayDay();
  const schedule = parsed_data || {};

  return (
    <div className="routine-display">
      <div className="routine-header">
        <h2>Your Class Routine</h2>
        <span className="routine-date">
          Uploaded: {new Date(created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="today-highlight">
        <h3>Today's Classes - [ {formatDate(new Date())} ]</h3>
        {schedule[today] && schedule[today].length > 0 ? (
          <div className="classes-list">
            {schedule[today].map((classItem, index) => (
              <div key={index} className="class-item today">
                <div className="class-time">
                  {classItem.time || 'Time not specified'}
                </div>
                <div className="class-name">{classItem.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-classes">No classes scheduled for today! 🎉</p>
        )}
      </div>

      <div className="week-schedule">
        <h3>Full Week Schedule</h3>
        <div className="days-container">
          {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            .filter(day => schedule[day])
            .map((day) => (
              <div 
                key={day} 
                className={`day-card ${day === today ? 'active' : ''}`}
              >
                <h4 className="day-name">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </h4>
                {schedule[day].length > 0 ? (
                  <div className="day-classes">
                    {schedule[day].map((classItem, index) => (
                      <div key={index} className="class-item">
                        <span className="class-info">{classItem.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-classes-day">No classes</p>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
