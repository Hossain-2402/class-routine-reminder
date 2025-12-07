'use client';

import { useState, useEffect, useRef } from 'react';

export default function NotificationSettings({ routine }) {
  const [permission, setPermission] = useState('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState('06:00');
  const [swRegistration, setSwRegistration] = useState(null);
  const [status, setStatus] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      setStatus('Service Workers not supported in this browser');
      return;
    }

    // Check current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Register service worker
    registerServiceWorker();

    // Load saved settings
    const savedEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    const savedTime = localStorage.getItem('notificationTime') || '12:16';
    
    setIsEnabled(savedEnabled);
    setNotificationTime(savedTime);

    // Start notification scheduler if enabled
    if (savedEnabled && Notification.permission === 'granted') {
      startNotificationScheduler(savedTime);
    }

    // Cleanup on unmount
    return () => {
      stopNotificationScheduler();
    };
  }, []);

  // Update scheduler when routine changes
  useEffect(() => {
    if (isEnabled && permission === 'granted' && routine) {
      startNotificationScheduler(notificationTime);
    }
  }, [routine, isEnabled, permission]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      setSwRegistration(registration);
      console.log('Service Worker registered successfully');
      setStatus('✅ Service Worker active and ready');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setStatus('❌ Service Worker registration failed');
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      setIsEnabled(true);
      localStorage.setItem('notificationsEnabled', 'true');
      startNotificationScheduler(notificationTime);
      
      // Show test notification
      showNotification('Notifications Enabled! 🎉', 'You will receive daily class reminders at ' + notificationTime, true);
    }
  };

  const toggleNotifications = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    localStorage.setItem('notificationsEnabled', newState.toString());

    if (newState && permission === 'granted') {
      startNotificationScheduler(notificationTime);
    } else {
      stopNotificationScheduler();
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setNotificationTime(newTime);
    localStorage.setItem('notificationTime', newTime);

    // Clear the "last sent" so it can trigger at new time
    localStorage.removeItem('lastNotificationDate');
    
    if (isEnabled && permission === 'granted') {
      stopNotificationScheduler();
      startNotificationScheduler(newTime);
      setStatus(`⏰ Scheduler updated for ${newTime}`);
    }
  };

  const startNotificationScheduler = (time) => {
    console.log(`Starting notification scheduler for ${time}`);
    
    // Clear existing scheduler
    stopNotificationScheduler();

    // Check every minute
    const checkNotification = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      console.log(`Checking: Current time ${currentTime}, Target time ${time}`);
      
      if (currentTime === time) {
        const lastSent = localStorage.getItem('lastNotificationDate');
        const today = new Date().toDateString();
        
        console.log(`Time match! Last sent: ${lastSent}, Today: ${today}`);
        
        // Only send once per day
        if (lastSent !== today) {
          console.log('Sending notification...');
          sendDailyReminder(false);
          localStorage.setItem('lastNotificationDate', today);
        } else {
          console.log('Already sent today, skipping...');
        }
      }
    };

    // Check immediately in case we're at the right time
    checkNotification();

    // Then check every minute
    const interval = setInterval(checkNotification, 60000);
    intervalRef.current = interval;
    
    console.log('Scheduler started, checking every minute');
  };

  const stopNotificationScheduler = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Scheduler stopped');
    }
  };

  const sendDailyReminder = (isTest = false) => {
    if (!routine || !routine.parsed_data) {
      showNotification('No Routine Found', 'Please add your class routine first', isTest);
      return;
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayClasses = routine.parsed_data[today] || [];

    if (todayClasses.length === 0) {
      showNotification('No Classes Today! 🎉', 'You have no classes scheduled for today. Enjoy your day!', isTest);
      return;
    }

    // Extract class names and times
    const classDetails = todayClasses.map(c => {
      const nameMatch = c.text.match(/^([A-Z\s0-9()]+)\s*\[/);
      const timeMatch = c.text.match(/\[([0-9]{2}:[0-9]{2})-([0-9]{2}:[0-9]{2})/);
      
      const name = nameMatch ? nameMatch[1].trim() : c.text;
      const time = timeMatch ? `${timeMatch[1]}` : '';
      
      return time ? `${time} - ${name}` : name;
    });

    const firstThree = classDetails.slice(0, 3).join('\n');
    const remaining = todayClasses.length > 3 ? `\n...and ${todayClasses.length - 3} more` : '';

    showNotification(
      `📚 You have ${todayClasses.length} class${todayClasses.length > 1 ? 'es' : ''} today`,
      firstThree + remaining,
      isTest
    );
  };

  const showNotification = (title, body, isTest = false) => {
    if (Notification.permission !== 'granted') {
      console.error('Notification permission not granted');
      return;
    }

    console.log(`Showing notification: ${title}`);

    // Try service worker notification first
    if (swRegistration) {
      swRegistration.showNotification(title, {
        body: body,
        tag: isTest ? 'class-reminder-test' : 'class-reminder',
        requireInteraction: false,
        vibrate: [200, 100, 200],
        timestamp: Date.now()
      }).then(() => {
        console.log('Notification shown successfully');
      }).catch(err => {
        console.error('Failed to show notification:', err);
      });
    } else {
      // Fallback to regular notification
      try {
        new Notification(title, {
          body: body,
          tag: isTest ? 'class-reminder-test' : 'class-reminder',
          requireInteraction: false
        });
        console.log('Fallback notification shown');
      } catch (err) {
        console.error('Failed to show fallback notification:', err);
      }
    }
  };

  const testNotification = () => {
    console.log('Test notification button clicked');
    // Force test notification regardless of "last sent" check
    sendDailyReminder(true);
  };

  const resetNotificationDate = () => {
    localStorage.removeItem('lastNotificationDate');
    setStatus('✅ Reset complete! You can now test again.');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#333' }}>
        🔔 Daily Notifications
      </h3>
      <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
        Get browser notifications with your daily class schedule (works even when tab is closed)
      </p>

      {status && (
        <div style={{
          padding: '8px 12px',
          background: status.includes('❌') ? '#fee' : '#e8f4f8',
          color: status.includes('❌') ? '#c33' : '#1976D2',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '13px'
        }}>
          {status}
        </div>
      )}

      {permission === 'denied' && (
        <div style={{
          padding: '12px 16px',
          background: '#fee',
          color: '#c33',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          borderLeft: '4px solid #c33'
        }}>
          ❌ Notifications are blocked. Please enable them in your browser settings.
        </div>
      )}

      {permission === 'default' && (
        <button
          onClick={requestPermission}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          Enable Notifications
        </button>
      )}

      {permission === 'granted' && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#333',
              fontWeight: '600'
            }}>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={toggleNotifications}
                style={{
                  marginRight: '8px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              Enable Daily Reminders
            </label>
          </div>

          {isEnabled && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333'
              }}>
                Notification Time
              </label>
              <input
                type="time"
                value={notificationTime}
                onChange={handleTimeChange}
                style={{
                  padding: '10px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '150px'
                }}
              />
              <p style={{ 
                fontSize: '12px', 
                color: '#999', 
                marginTop: '6px',
                marginBottom: '0'
              }}>
                Current time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={testNotification}
              disabled={!routine}
              style={{
                padding: '10px 20px',
                background: !routine ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: !routine ? 'not-allowed' : 'pointer'
              }}
            >
              Test Notification Now
            </button>

            <button
              onClick={resetNotificationDate}
              style={{
                padding: '10px 20px',
                background: '#f0f0f0',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reset Daily Check
            </button>
          </div>

          {isEnabled && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#efe',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#2d7a2d',
              borderLeft: '4px solid #3c3'
            }}>
              ✅ Notifications enabled! You'll receive reminders daily at {notificationTime}
              <br />
              <small style={{ opacity: 0.8 }}>Works even when this tab is closed (browser must be running)</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
