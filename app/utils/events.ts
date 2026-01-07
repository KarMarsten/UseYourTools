import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './calendarSync';

export interface Event {
  id: string;
  dateKey: string; // Format: "YYYY-MM-DD"
  title: string;
  startTime: string; // Format: "HH:MM"
  endTime?: string; // Format: "HH:MM" - optional for reminders
  type: 'interview' | 'appointment' | 'reminder';
  notificationId?: string; // ID for scheduled notification (10 min before event)
  thankYouNoteReminderId?: string; // ID for scheduled thank you note reminder
  thankYouNoteStatus?: 'pending' | 'sent' | 'skipped'; // Thank-you note tracking for interview events
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

export const saveEvent = async (event: Event, skipBidirectionalUpdate = false): Promise<void> => {
  try {
    // Get existing event to handle bi-directional linking
    const existingEvent = await getEventById(event.id);
    const previousApplicationId = existingEvent?.applicationId;
    const newApplicationId = event.applicationId;
    const isNewEvent = !existingEvent;
    const isNewInterview = isNewEvent && event.type === 'interview';

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

    // Schedule thank you note reminder for new interview events
    if (isNewInterview) {
    // Initialize thank-you note status as pending
    event.thankYouNoteStatus = 'pending';
      const { scheduleThankYouNoteReminder } = await import('./eventNotifications');
      const { loadPreferences } = await import('./preferences');
      const preferences = await loadPreferences();
      const reminderId = await scheduleThankYouNoteReminder(
        event,
        preferences.thankYouNoteDaysAfterInterview || 1
      );
      if (reminderId) {
        event.thankYouNoteReminderId = reminderId;
      }
      
      // If there's an application linked, complete any existing follow-up reminders
      // (both application and interview types) since a thank you note is now pending
      if (event.applicationId) {
        try {
          const { getFollowUpRemindersForApplication, completeFollowUpReminder } = await import('./followUpReminders');
          const reminders = await getFollowUpRemindersForApplication(event.applicationId);
          const activeReminders = reminders.filter(r => !r.completed);
          for (const reminder of activeReminders) {
            await completeFollowUpReminder(reminder.id);
          }
        } catch (error) {
          console.error('Error completing follow-up reminders:', error);
          // Don't fail the event save if reminder completion fails
        }
      }
    }

    const key = `${EVENTS_KEY_PREFIX}${event.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(event));

    // Handle bi-directional linking: Update application's eventIds array
    if (!skipBidirectionalUpdate && previousApplicationId !== newApplicationId) {
      const { addApplicationEventId, removeApplicationEventId } = await import('./applications');
      // Remove from old application if it changed
      if (previousApplicationId) {
        await removeApplicationEventId(previousApplicationId, event.id, true);
      }
      // Add to new application
      if (newApplicationId) {
        await addApplicationEventId(newApplicationId, event.id, true);
      }
    }
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
    // Load event first to get calendarEventId and applicationId
    const key = `${EVENTS_KEY_PREFIX}${eventId}`;
    const eventData = await AsyncStorage.getItem(key);
    
    if (eventData) {
      const event = JSON.parse(eventData) as Event;
      
      // Unlink from application before deleting
      if (event.applicationId) {
        const { removeApplicationEventId } = await import('./applications');
        await removeApplicationEventId(event.applicationId, eventId, true);
      }
      
      // Delete from calendar if it exists
      if (event.calendarEventId) {
        await deleteCalendarEvent(event.calendarEventId);
      }

      // Cancel thank you note reminder if it exists
      if (event.thankYouNoteReminderId) {
        const { cancelEventNotification } = await import('./eventNotifications');
        await cancelEventNotification(event.thankYouNoteReminderId);
      }

      // Cancel event notification if it exists
      if (event.notificationId) {
        const { cancelEventNotification } = await import('./eventNotifications');
        await cancelEventNotification(event.notificationId);
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

/**
 * Get count of pending thank you notes
 */
export const getPendingThankYouNotesCount = async (): Promise<number> => {
  try {
    const allEvents = await getAllEvents();
    return allEvents.filter(
      e => e.type === 'interview' && 
      (!e.thankYouNoteStatus || e.thankYouNoteStatus === 'pending')
    ).length;
  } catch (error) {
    console.error('Error getting pending thank you notes count:', error);
    return 0;
  }
};

/**
 * Get count of overdue thank you notes (past due date, still pending)
 */
export const getOverdueThankYouNotesCount = async (): Promise<number> => {
  try {
    const allEvents = await getAllEvents();
    const { loadPreferences } = await import('./preferences');
    const { getDateKey } = await import('./timeFormatter');
    const { getAllApplications } = await import('./applications');
    const prefs = await loadPreferences();
    const daysAfterInterview = prefs.thankYouNoteDaysAfterInterview || 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = getDateKey(today);
    
    // Load all applications to check for rejected status
    const allApplications = await getAllApplications();
    const applicationStatusMap = new Map<string, string>();
    allApplications.forEach(app => {
      applicationStatusMap.set(app.id, app.status);
    });
    
    return allEvents.filter(e => {
      if (e.type !== 'interview') {
        return false;
      }
      
      // Check if thank you note status is pending (undefined or 'pending')
      // If it's 'sent' or 'skipped', don't count it
      if (e.thankYouNoteStatus && e.thankYouNoteStatus !== 'pending') {
        return false;
      }
      
      // Skip if the linked application is rejected
      if (e.applicationId) {
        const appStatus = applicationStatusMap.get(e.applicationId);
        if (appStatus === 'rejected') {
          return false;
        }
      }
      
      // Calculate when the thank you note is due (interview date + daysAfterInterview)
      const [year, month, day] = e.dateKey.split('-').map(Number);
      const interviewDate = new Date(year, month - 1, day);
      interviewDate.setHours(0, 0, 0, 0);
      const dueDate = new Date(interviewDate);
      dueDate.setDate(dueDate.getDate() + daysAfterInterview);
      dueDate.setHours(0, 0, 0, 0);
      const dueDateKey = getDateKey(dueDate);
      
      // Only count if interview has happened (interview date is in the past) AND due date is in the past
      const interviewDateKey = getDateKey(interviewDate);
      return interviewDateKey < todayKey && dueDateKey < todayKey;
    }).length;
  } catch (error) {
    console.error('Error getting overdue thank you notes count:', error);
    return 0;
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

/**
 * Link an event to an application (bi-directional)
 */
export const linkEventToApplication = async (eventId: string, applicationId: string): Promise<void> => {
  try {
    const event = await getEventById(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }
    event.applicationId = applicationId;
    await saveEvent(event); // saveEvent handles bi-directional linking
  } catch (error) {
    console.error('Error linking event to application:', error);
    throw error;
  }
};

/**
 * Unlink an event from its application (bi-directional)
 */
export const unlinkEventFromApplication = async (eventId: string): Promise<void> => {
  try {
    const event = await getEventById(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }
    if (event.applicationId) {
      event.applicationId = undefined;
      await saveEvent(event); // saveEvent handles bi-directional linking
    }
  } catch (error) {
    console.error('Error unlinking event from application:', error);
    throw error;
  }
};

/**
 * Update thank-you note status for an interview event.
 * If marking as sent or skipped, cancel any scheduled thank-you reminder.
 */
export const setEventThankYouStatus = async (
  eventId: string,
  status: 'pending' | 'sent' | 'skipped'
): Promise<void> => {
  try {
    const event = await getEventById(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }
    if (event.type !== 'interview') {
      throw new Error('Thank-you note status is only applicable to interview events');
    }
    event.thankYouNoteStatus = status;
    // Cancel reminder when resolved
    if ((status === 'sent' || status === 'skipped') && event.thankYouNoteReminderId) {
      const { cancelEventNotification } = await import('./eventNotifications');
      await cancelEventNotification(event.thankYouNoteReminderId);
      event.thankYouNoteReminderId = undefined;
    }
    
    // If thank you note is sent, complete any existing follow-up reminders for this application
    // (both application and interview types)
    if (status === 'sent' && event.applicationId) {
      try {
        const { getFollowUpRemindersForApplication, completeFollowUpReminder } = await import('./followUpReminders');
        const reminders = await getFollowUpRemindersForApplication(event.applicationId);
        const activeReminders = reminders.filter(r => !r.completed);
        for (const reminder of activeReminders) {
          await completeFollowUpReminder(reminder.id);
        }
      } catch (error) {
        console.error('Error completing follow-up reminders:', error);
        // Don't fail the thank you note status update if reminder completion fails
      }
    }
    
    await saveEvent(event);
  } catch (error) {
    console.error('Error updating thank-you note status:', error);
    throw error;
  }
};

