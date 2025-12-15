import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './calendarSync';

export interface Event {
  id: string;
  dateKey: string; // Format: "YYYY-MM-DD"
  title: string;
  startTime: string; // Format: "HH:MM"
  endTime?: string; // Format: "HH:MM" - optional for reminders
  type: 'interview' | 'appointment' | 'reminder';
  notificationId?: string; // ID for scheduled notification
  calendarEventId?: string; // ID for synced calendar event
  applicationId?: string; // ID of the linked job application (if type is 'interview')
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
    // Sync to calendar if enabled
    if (event.calendarEventId) {
      // Update existing calendar event
      await updateCalendarEvent(event, event.calendarEventId);
    } else {
      // Create new calendar event
      const calendarEventId = await createCalendarEvent(event);
      if (calendarEventId) {
        event.calendarEventId = calendarEventId;
      }
    }

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
    // Load event first to get calendarEventId
    const key = `${EVENTS_KEY_PREFIX}${eventId}`;
    const eventData = await AsyncStorage.getItem(key);
    
    if (eventData) {
      const event = JSON.parse(eventData) as Event;
      
      // Delete from calendar if it exists
      if (event.calendarEventId) {
        await deleteCalendarEvent(event.calendarEventId);
      }
    }

    // Delete from AsyncStorage
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const getEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const key = `${EVENTS_KEY_PREFIX}${eventId}`;
    const eventData = await AsyncStorage.getItem(key);
    if (eventData) {
      return JSON.parse(eventData) as Event;
    }
    return null;
  } catch (error) {
    console.error('Error getting event:', error);
    return null;
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

