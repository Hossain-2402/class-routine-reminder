'use client';

import { useState } from 'react';
import '../styles/components.css';

export default function RoutineTextInput({ userId, onRoutineSaved }) {
  const [routineText, setRoutineText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!routineText.trim()) {
      setError('Please enter your routine text');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Save routine to database
      const saveResponse = await fetch('/api/save-routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          routineText: routineText.trim(),
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save routine');
      }

      setSuccess('Routine saved successfully! Daily reminders are now set up.');
      setRoutineText('');
      
      // Notify parent component
      if (onRoutineSaved) {
        onRoutineSaved();
      }
    } catch (err) {
      setError(err.message || 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setRoutineText('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="text-input-container">
      <h2 className="input-title">Enter Your Class Routine</h2>
   
      <form onSubmit={handleSubmit} className="routine-form">
        <div className="form-group">
          <textarea
            id="routine-text"
            value={routineText}
            onChange={(e) => setRoutineText(e.target.value)}
            placeholder="Enter your class routine here...&#10;&#10;Monday&#10;9:00 AM - Math 101&#10;11:00 AM - Physics Lab&#10;&#10;Tuesday&#10;10:00 AM - Chemistry..."
            rows="15"
            className="routine-textarea"
          />
        </div>

        {error && <div className="message error-msg">{error}</div>}
        {success && <div className="message success-msg">{success}</div>}

        <div className="button-group">
          <button
            type="button"
            onClick={handleClear}
            className="clear-btn"
            disabled={loading || !routineText}
          >
            Clear
          </button>
          <button
            type="submit"
            className="save-btn"
            disabled={loading || !routineText.trim()}
          >
            {loading ? 'Saving...' : 'Save Routine'}
          </button>
        </div>
      </form>
    </div>
  );
}
