import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { Event } from './events';
import { loadPreferences, UserPreferences } from './preferences';

let calendarId: string | null = null;

/**
 * Get available calendars for Google Calendar sync
 * Since Google calendar detection is unreliable across platforms, we show all writable calendars
 * and let the user select their Google calendar manually
 */
export const getGoogleCalendars = async (): Promise<Calendar.Calendar[]> => {
  try {
    // Request permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Calendar permissions not granted');
      return [];
    }

    // Get all calendars
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // Filter for writable calendars only (user can select their Google calendar from this list)
    // We show all writable calendars since detecting Google calendars reliably is difficult
    const writableCalendars = calendars.filter(cal => {
      return cal.allowsModifications !== false;
    });
    
    // Sort calendars: try to put Google calendars first if we can detect them
    const sortedCalendars = writableCalendars.sort((a, b) => {
      const aIsGoogle = isLikelyGoogleCalendar(a);
      const bIsGoogle = isLikelyGoogleCalendar(b);
      if (aIsGoogle && !bIsGoogle) return -1;
      if (!aIsGoogle && bIsGoogle) return 1;
      return 0;
    });
    
    return sortedCalendars;
  } catch (error) {
    console.error('Error getting calendars:', error);
    return [];
  }
};

/**
 * Helper function to check if a calendar is likely a Google calendar
 * (used for sorting, not filtering)
 */
const isLikelyGoogleCalendar = (calendar: Calendar.Calendar): boolean => {
  const source = calendar.source;
  const sourceType = source?.type?.toLowerCase() || '';
  const sourceName = source?.name?.toLowerCase() || '';
  const ownerAccount = (calendar as any).ownerAccount?.toLowerCase() || '';
  
  return sourceType.includes('google') || 
         sourceName.includes('google') ||
         ownerAccount.includes('gmail.com') ||
         ownerAccount.includes('googlemail.com');
};

/**
 * Request calendar permissions and get/create the app's calendar
 */
export const ensureCalendarAccess = async (): Promise<string | null> => {
  try {
    // Request permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Calendar permissions not granted');
      return null;
    }

    // For iOS, we need reminders permission too (though we won't use reminders)
    if (Platform.OS === 'ios') {
      const remindersStatus = await Calendar.requestRemindersPermissionsAsync();
      if (remindersStatus.status !== 'granted') {
        console.warn('Reminders permissions not granted');
      }
    }

    // Get all calendars and filter for writable ones
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // Filter to only writable calendars (calendars that allow modifications)
    const writableCalendars = calendars.filter(cal => cal.allowsModifications !== false);
    
    if (writableCalendars.length === 0) {
      console.warn('No writable calendars found');
      return null;
    }
    
    // For iOS, prefer the default calendar that's writable
    // For Android, prefer the primary calendar that's writable
    const defaultCalendar = writableCalendars.find(cal => 
      Platform.OS === 'ios' 
        ? cal.isPrimary || cal.source?.name === 'Default' 
        : cal.isPrimary || cal.source?.isLocalAccount
    ) || writableCalendars[0];

    if (defaultCalendar) {
      calendarId = defaultCalendar.id;
      return calendarId;
    }

    // If no writable calendar found, try to create one
    // For iOS, try to create a calendar on the default source
    // For Android, create a calendar on the local source
    try {
      const sources = await Calendar.getSourcesAsync();
      const defaultSource = Platform.OS === 'ios'
        ? sources.find(s => s.name === 'Default' || s.isLocalAccount) || sources[0]
        : sources.find(s => s.isLocalAccount) || sources[0];
      
      if (defaultSource && defaultSource.type !== 'readonly') {
        const newCalendarId = await Calendar.createCalendarAsync({
          title: 'UseYourTools',
          color: '#8C6A4A',
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: defaultSource.id,
          source: defaultSource,
          name: 'UseYourTools',
          ownerAccount: 'personal',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          allowsModifications: true,
        });
        calendarId = newCalendarId;
        return calendarId;
      }
    } catch (createError) {
      console.error('Error creating calendar:', createError);
      // If we can't create a calendar, try to use the first writable calendar we found
      if (writableCalendars.length > 0) {
        calendarId = writableCalendars[0].id;
        return calendarId;
      }
    }

    return null;
  } catch (error) {
    console.error('Error ensuring calendar access:', error);
    return null;
  }
};

/**
 * Convert app event to calendar event format
 */
const eventToCalendarEvent = async (event: Event): Promise<any> => {
  const preferences = await loadPreferences();
  
  // Parse date from dateKey (YYYY-MM-DD)
  const [year, month, day] = event.dateKey.split('-').map(Number);
  
  // Parse start time
  const [startHour, startMinute] = event.startTime.split(':').map(Number);
  
  // Create start date
  const startDate = new Date(year, month - 1, day, startHour, startMinute);
  
  // Create end date
  let endDate: Date;
  if (event.endTime) {
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    endDate = new Date(year, month - 1, day, endHour, endMinute);
  } else {
    // Default to 1 hour duration if no end time
    endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);
  }

  // Build description from event details
  let description = '';
  if (event.type === 'interview' || event.type === 'appointment') {
    const details: string[] = [];
    if (event.company) details.push(`Company: ${event.company}`);
    if (event.jobTitle) details.push(`Job Title: ${event.jobTitle}`);
    if (event.contactName) details.push(`Contact: ${event.contactName}`);
    if (event.phone) details.push(`Phone: ${event.phone}`);
    if (event.email) details.push(`Email: ${event.email}`);
    if (event.address) details.push(`Address: ${event.address}`);
    if (event.notes) details.push(`Notes: ${event.notes}`);
    description = details.join('\n');
  } else if (event.notes) {
    description = event.notes;
  }

  // Handle timezone
  let timeZone: string | undefined;
  if (preferences.timezoneMode === 'custom' && preferences.timezone) {
    timeZone = preferences.timezone;
  } else {
    // Use device timezone
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  return {
    title: `${event.type.charAt(0).toUpperCase() + event.type.slice(1)}: ${event.title}`,
    startDate,
    endDate,
    timeZone,
    notes: description,
    location: event.address,
    alarms: [
      {
        relativeOffset: -10, // 10 minutes before
        method: Calendar.AlarmMethod.ALERT,
      },
    ],
  };
};

/**
 * Create a calendar event from an app event
 */
export const createCalendarEvent = async (event: Event): Promise<string | null> => {
  try {
    const preferences = await loadPreferences();
    
    // Check if calendar sync is enabled
    if (preferences.calendarSyncProvider === 'none') {
      return null;
    }

    // For Google Calendar, use the selected calendar ID from preferences
    if (preferences.calendarSyncProvider === 'google') {
      if (!preferences.googleCalendarId) {
        console.warn('Google Calendar ID not set in preferences');
        return null;
      }
      // Verify the calendar still exists and is accessible
      try {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const selectedCalendar = calendars.find(cal => cal.id === preferences.googleCalendarId);
        if (!selectedCalendar || !selectedCalendar.allowsModifications) {
          console.warn('Selected Google Calendar not found or not writable');
          return null;
        }
        calendarId = selectedCalendar.id;
      } catch (error) {
        console.error('Error verifying Google Calendar:', error);
        return null;
      }
    } else {
      const calId = await ensureCalendarAccess();
      if (!calId) {
        return null;
      }
      calendarId = calId;
    }

    const calendarEvent = await eventToCalendarEvent(event);
    const eventId = await Calendar.createEventAsync(calendarId, calendarEvent);
    
    return eventId;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
};

/**
 * Update a calendar event from an app event
 */
export const updateCalendarEvent = async (event: Event, calendarEventId: string): Promise<boolean> => {
  try {
    const preferences = await loadPreferences();
    
    if (preferences.calendarSyncProvider === 'none') {
      return false;
    }

    const calendarEvent = await eventToCalendarEvent(event);
    await Calendar.updateEventAsync(calendarEventId, calendarEvent);
    
    return true;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (calendarEventId: string): Promise<boolean> => {
  try {
    await Calendar.deleteEventAsync(calendarEventId);
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
};

/**
 * Sync all existing events to the calendar
 */
export const syncAllEventsToCalendar = async (events: Event[]): Promise<void> => {
  try {
    const preferences = await loadPreferences();
    
    if (preferences.calendarSyncProvider === 'none') {
      return;
    }

    let calId: string | null = null;
    
    if (preferences.calendarSyncProvider === 'google') {
      if (!preferences.googleCalendarId) {
        Alert.alert(
          'Calendar Sync',
          'Please select a Google Calendar in Settings before syncing.'
        );
        return;
      }
      // Verify the calendar still exists
      try {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const selectedCalendar = calendars.find(cal => cal.id === preferences.googleCalendarId);
        if (!selectedCalendar || !selectedCalendar.allowsModifications) {
          Alert.alert(
            'Calendar Sync',
            'Selected Google Calendar not found or not writable. Please select a different calendar in Settings.'
          );
          return;
        }
        calId = selectedCalendar.id;
      } catch (error) {
        Alert.alert(
          'Calendar Sync',
          'Could not access Google Calendar. Please check calendar permissions in Settings.'
        );
        return;
      }
    } else {
      calId = await ensureCalendarAccess();
      if (!calId) {
        Alert.alert(
          'Calendar Sync',
          'Could not access calendar. Please check calendar permissions in Settings.'
        );
        return;
      }
    }

    // Import saveEvent to update events with calendar IDs
    const { saveEvent } = await import('./events');

    // Sync events that don't already have calendar IDs
    const eventsToSync = events.filter(e => !e.calendarEventId);
    
    // Create calendar events for all app events without calendar IDs
    const results = await Promise.allSettled(
      eventsToSync.map(async (event) => {
        const calendarEventId = await createCalendarEvent(event);
        if (calendarEventId) {
          // Update the event with the calendar ID and save it
          event.calendarEventId = calendarEventId;
          await saveEvent(event);
        }
        return calendarEventId;
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    const alreadySyncedCount = events.length - eventsToSync.length;
    const failCount = eventsToSync.length - successCount;

    if (alreadySyncedCount > 0 && successCount === 0 && failCount === 0) {
      Alert.alert(
        'Calendar Sync',
        `All ${alreadySyncedCount} event${alreadySyncedCount !== 1 ? 's are' : ' is'} already synced to calendar.`
      );
    } else if (successCount > 0) {
      const message = alreadySyncedCount > 0
        ? `Synced ${successCount} new event${successCount !== 1 ? 's' : ''} to calendar. ${alreadySyncedCount} event${alreadySyncedCount !== 1 ? 's were' : ' was'} already synced.`
        : `Synced ${successCount} event${successCount !== 1 ? 's' : ''} to calendar.`;
      Alert.alert('Calendar Sync', message);
    } else if (failCount > 0) {
      Alert.alert('Calendar Sync', `Failed to sync ${failCount} event${failCount !== 1 ? 's' : ''} to calendar.`);
    }
  } catch (error) {
    console.error('Error syncing all events to calendar:', error);
    Alert.alert('Error', 'Failed to sync events to calendar');
  }
};

