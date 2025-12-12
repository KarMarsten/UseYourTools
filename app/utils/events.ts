import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Event {
  id: string;
  dateKey: string; // Format: "YYYY-MM-DD"
  title: string;
  startTime: string; // Format: "HH:MM"
  endTime?: string; // Format: "HH:MM" - optional for reminders
  type: 'interview' | 'appointment' | 'reminder';
  notificationId?: string; // ID for scheduled notification
  // Optional fields for appointments/interviews
  notes?: string; // General notes for any event type
  address?: string; // Address (for interviews/appointments)
  contactName?: string; // Name of contact person (for interviews/appointments)
  email?: string; // Email address (for interviews/appointments)
  phone?: string; // Phone number (for interviews/appointments)
  company?: string; // Company name (for interviews/appointments)
  jobTitle?: string; // Job title/position (for interviews/appointments)
}

const EVENTS_KEY_PREFIX = 'planner_event_';

export const saveEvent = async (event: Event): Promise<void> => {
  try {
    const key = `${EVENTS_KEY_PREFIX}${event.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(event));
  } catch (error) {
    console.error('Error saving event:', error);
    throw error;
  }
};

export const loadEventsForDate = async (dateKey: string): Promise<Event[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const eventKeys = allKeys.filter(key => key.startsWith(EVENTS_KEY_PREFIX));
    const events: Event[] = [];
    
    for (const key of eventKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        const event = JSON.parse(value) as Event;
        if (event.dateKey === dateKey) {
          events.push(event);
        }
      }
    }
    
    // Sort events by start time
    return events.sort((a, b) => {
      const [aHours, aMinutes] = a.startTime.split(':').map(Number);
      const [bHours, bMinutes] = b.startTime.split(':').map(Number);
      const aTotal = aHours * 60 + aMinutes;
      const bTotal = bHours * 60 + bMinutes;
      return aTotal - bTotal;
    });
  } catch (error) {
    console.error('Error loading events:', error);
    return [];
  }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const key = `${EVENTS_KEY_PREFIX}${eventId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const eventKeys = allKeys.filter(key => key.startsWith(EVENTS_KEY_PREFIX));
    const events: Event[] = [];
    
    for (const key of eventKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        events.push(JSON.parse(value) as Event);
      }
    }
    
    return events;
  } catch (error) {
    console.error('Error loading all events:', error);
    return [];
  }
};

export const generateEventId = (): string => {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

