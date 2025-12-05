// Parse routine text into structured data
export const parseRoutineText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  const schedule = {};
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let currentDay = null;
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    // Check if line contains a day
    const dayFound = days.find(day => lowerLine.includes(day));
    if (dayFound) {
      currentDay = dayFound;
      schedule[currentDay] = [];
      return;
    }
    
    // If we have a current day, add this as a class
    if (currentDay && line.trim()) {
      // Try to extract time and class info
      const timeMatch = line.match(/(\d{1,2}:\d{2}|\d{1,2}\s*(?:am|pm))/i);
      schedule[currentDay].push({
        raw: line.trim(),
        time: timeMatch ? timeMatch[0] : null,
        text: line.trim()
      });
    }
  });
  
  return schedule;
};

// Get today's day name
export const getTodayDay = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
};

// Get today's classes from schedule
export const getTodayClasses = (schedule) => {
  const today = getTodayDay();
  return schedule[today] || [];
};

// Format date for display
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};
