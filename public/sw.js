// Service Worker for Class Routine Reminders
const CACHE_NAME = 'class-routine-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { notificationTime, routine } = event.data;
    scheduleNotification(notificationTime, routine);
  }
});

// Schedule notification check
function scheduleNotification(notificationTime, routine) {
  // Check every minute if it's time to send notification
  setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (currentTime === notificationTime) {
      checkAndSendNotification(routine);
    }
  }, 60000); // Check every minute
}

// Check if notification was already sent today
function wasNotificationSentToday() {
  const lastSent = localStorage.getItem('lastNotificationDate');
  const today = new Date().toDateString();
  return lastSent === today;
}

// Mark notification as sent
function markNotificationSent() {
  const today = new Date().toDateString();
  localStorage.setItem('lastNotificationDate', today);
}

// Check and send notification
async function checkAndSendNotification(routine) {
  // Prevent sending multiple notifications on the same day
  if (wasNotificationSentToday()) {
    return;
  }

  if (!routine || !routine.parsed_data) {
    return;
  }

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  const todayClasses = routine.parsed_data[today] || [];

  if (todayClasses.length === 0) {
    await self.registration.showNotification('No Classes Today! 🎉', {
      body: 'You have no classes scheduled for today. Enjoy your day!',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'class-reminder',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    });
  } else {
    // Extract class names
    const classNames = todayClasses.map(c => {
      const match = c.text.match(/^([A-Z\s0-9()]+)\s*\[/);
      return match ? match[1].trim() : c.text;
    }).slice(0, 3); // Show max 3 classes

    const message = todayClasses.length <= 3
      ? `${classNames.join(', ')}`
      : `${classNames.join(', ')} and ${todayClasses.length - 3} more`;

    await self.registration.showNotification('📚 Today\'s Classes', {
      body: `You have ${todayClasses.length} class${todayClasses.length > 1 ? 'es' : ''} today:\n${message}`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'class-reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view', title: 'View Schedule' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }

  markNotificationSent();
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Push event (for future push notifications)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Class Reminder', {
      body: data.body || 'You have classes today',
      icon: '/icon-192.png',
      badge: '/badge-72.png'
    })
  );
});
