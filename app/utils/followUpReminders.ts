import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions } from './eventNotifications';

export interface FollowUpReminder {
  id: string;
  applicationId: string; // ID of the associated job application
  type: 'application' | 'interview'; // Type of follow-up
  dueDate: string; // ISO 8601 date string (YYYY-MM-DDTHH:mm:ss.sssZ)
  company: string; // Company name for quick reference
  positionTitle: string; // Position title for quick reference
  completed: boolean; // Whether the follow-up has been completed
  completedAt?: string; // ISO 8601 date string when completed
  notificationId?: string; // ID of the scheduled notification
  createdAt: string; // ISO 8601 date string when reminder was created
}

const FOLLOW_UP_REMINDERS_KEY_PREFIX = 'followup_reminder_';
const FOLLOW_UP_REMINDERS_INDEX_KEY = 'followup_reminders_index';

/**
 * Generate a unique ID for a follow-up reminder
 */
const generateFollowUpId = (): string => {
  return `followup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all follow-up reminder IDs from index
 */
const getFollowUpRemindersIndex = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(FOLLOW_UP_REMINDERS_INDEX_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading follow-up reminders index:', error);
    return [];
  }
};

/**
 * Save a follow-up reminder
 */
export const saveFollowUpReminder = async (reminder: FollowUpReminder): Promise<void> => {
  try {
    const key = `${FOLLOW_UP_REMINDERS_KEY_PREFIX}${reminder.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(reminder));

    // Update index
    const index = await getFollowUpRemindersIndex();
    if (!index.includes(reminder.id)) {
      index.push(reminder.id);
      await AsyncStorage.setItem(FOLLOW_UP_REMINDERS_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Error saving follow-up reminder:', error);
    throw error;
  }
};

/**
 * Get all follow-up reminders
 */
export const getAllFollowUpReminders = async (): Promise<FollowUpReminder[]> => {
  try {
    const index = await getFollowUpRemindersIndex();
    const reminders: FollowUpReminder[] = [];

    for (const id of index) {
      const key = `${FOLLOW_UP_REMINDERS_KEY_PREFIX}${id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        reminders.push(JSON.parse(stored) as FollowUpReminder);
      }
    }

    // Sort by due date (earliest first)
    return reminders.sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  } catch (error) {
    console.error('Error loading follow-up reminders:', error);
    return [];
  }
};

/**
 * Get active (incomplete) follow-up reminders
 */
export const getActiveFollowUpReminders = async (): Promise<FollowUpReminder[]> => {
  try {
    const allReminders = await getAllFollowUpReminders();
    return allReminders.filter(r => !r.completed);
  } catch (error) {
    console.error('Error loading active follow-up reminders:', error);
    return [];
  }
};

/**
 * Get count of overdue follow-up reminders (past due date, still pending)
 */
export const getOverdueFollowUpRemindersCount = async (): Promise<number> => {
  try {
    const allReminders = await getAllFollowUpReminders();
    const { getAllApplications } = await import('./applications');
    const { getAllEvents } = await import('./events');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Load all applications to check for rejected status
    const allApplications = await getAllApplications();
    const applicationStatusMap = new Map<string, string>();
    allApplications.forEach(app => {
      applicationStatusMap.set(app.id, app.status);
    });
    
    // Load all events to check for thank you notes (pending or sent)
    const allEvents = await getAllEvents();
    const applicationsWithThankYouNotes = new Set<string>();
    allEvents.forEach(event => {
      if (event.type === 'interview' && 
          event.applicationId && 
          (event.thankYouNoteStatus === 'sent' || event.thankYouNoteStatus === 'pending')) {
        applicationsWithThankYouNotes.add(event.applicationId);
      }
    });
    
    return allReminders.filter(r => {
      if (r.completed) {
        return false;
      }
      
      // Skip if the linked application is rejected
      if (r.applicationId) {
        const appStatus = applicationStatusMap.get(r.applicationId);
        if (appStatus === 'rejected') {
          return false;
        }
        
        // Skip if a thank you note exists (pending or sent) for this application
        // This applies to all follow-up reminders (both application and interview types)
        if (r.applicationId && applicationsWithThankYouNotes.has(r.applicationId)) {
          return false;
        }
      }
      
      const dueDate = new Date(r.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      // Only count if due date is in the past
      return dueDate < today;
    }).length;
  } catch (error) {
    console.error('Error getting overdue follow-up reminders count:', error);
    return 0;
  }
};

/**
 * Get follow-up reminders for a specific application
 */
export const getFollowUpRemindersForApplication = async (applicationId: string): Promise<FollowUpReminder[]> => {
  try {
    const allReminders = await getAllFollowUpReminders();
    return allReminders.filter(r => r.applicationId === applicationId);
  } catch (error) {
    console.error('Error loading follow-up reminders for application:', error);
    return [];
  }
};

/**
 * Get a follow-up reminder by ID
 */
export const getFollowUpReminderById = async (reminderId: string): Promise<FollowUpReminder | null> => {
  try {
    const key = `${FOLLOW_UP_REMINDERS_KEY_PREFIX}${reminderId}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as FollowUpReminder;
    }
    return null;
  } catch (error) {
    console.error('Error getting follow-up reminder by ID:', error);
    return null;
  }
};

/**
 * Mark a follow-up reminder as completed
 * @param reminderId - ID of the reminder to complete
 * @param completedDate - Optional date to mark as completed (defaults to now)
 */
export const completeFollowUpReminder = async (reminderId: string, completedDate?: Date): Promise<void> => {
  try {
    const key = `${FOLLOW_UP_REMINDERS_KEY_PREFIX}${reminderId}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const reminder = JSON.parse(stored) as FollowUpReminder;
      reminder.completed = true;
      reminder.completedAt = (completedDate || new Date()).toISOString();
      
      // Cancel notification if it exists
      if (reminder.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
        } catch (error) {
          console.error('Error canceling notification:', error);
        }
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(reminder));
    }
  } catch (error) {
    console.error('Error completing follow-up reminder:', error);
    throw error;
  }
};

/**
 * Mark a follow-up reminder as completed and create the next follow-up reminder
 * @param reminderId - ID of the follow-up reminder to complete
 * @param createNext - Whether to create a new follow-up reminder (default: true)
 * @returns The newly created follow-up reminder, or null if not created
 */
export const completeFollowUpReminderAndCreateNext = async (
  reminderId: string,
  createNext: boolean = true
): Promise<FollowUpReminder | null> => {
  try {
    // Get the reminder before completing it
    const reminder = await getFollowUpReminderById(reminderId);
    if (!reminder) {
      throw new Error(`Follow-up reminder ${reminderId} not found`);
    }

    // Complete the current reminder
    await completeFollowUpReminder(reminderId);

    // Create next follow-up if requested
    if (createNext) {
      const { loadPreferences } = await import('./preferences');
      const prefs = await loadPreferences();
      const daysBetweenFollowUps = prefs.followUpDaysBetweenFollowUps || 2;

      // Check if application is rejected - don't create next follow-up if rejected
      const { getAllApplications } = await import('./applications');
      const allApplications = await getAllApplications();
      const application = allApplications.find(app => app.id === reminder.applicationId);
      
      if (application && application.status === 'rejected') {
        return null; // Don't create next follow-up for rejected applications
      }

      // For interview follow-ups, check if a thank you note exists
      if (reminder.type === 'interview') {
        const { getAllEvents } = await import('./events');
        const allEvents = await getAllEvents();
        const interviewEvents = allEvents.filter(
          e => e.type === 'interview' && 
          e.applicationId === reminder.applicationId &&
          (e.thankYouNoteStatus === 'sent' || e.thankYouNoteStatus === 'pending')
        );
        
        // If a thank you note exists, don't create a follow-up reminder
        if (interviewEvents.length > 0) {
          return null;
        }
      }

      // Create the next follow-up reminder
      if (reminder.type === 'application') {
        return await createApplicationFollowUp(
          reminder.applicationId,
          reminder.company,
          reminder.positionTitle,
          daysBetweenFollowUps
        );
      } else {
        return await createInterviewFollowUp(
          reminder.applicationId,
          reminder.company,
          reminder.positionTitle,
          daysBetweenFollowUps
        );
      }
    }

    return null;
  } catch (error) {
    console.error('Error completing follow-up reminder and creating next:', error);
    throw error;
  }
};

/**
 * Delete a follow-up reminder
 */
export const deleteFollowUpReminder = async (reminderId: string): Promise<void> => {
  try {
    const key = `${FOLLOW_UP_REMINDERS_KEY_PREFIX}${reminderId}`;
    
    // Cancel notification if it exists
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const reminder = JSON.parse(stored) as FollowUpReminder;
      if (reminder.notificationId) {
        try {
          await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
        } catch (error) {
          console.error('Error canceling notification:', error);
        }
      }
    }
    
    await AsyncStorage.removeItem(key);

    // Update index
    const index = await getFollowUpRemindersIndex();
    const updatedIndex = index.filter(id => id !== reminderId);
    await AsyncStorage.setItem(FOLLOW_UP_REMINDERS_INDEX_KEY, JSON.stringify(updatedIndex));
  } catch (error) {
    console.error('Error deleting follow-up reminder:', error);
    throw error;
  }
};

/**
 * Schedule a notification for a follow-up reminder
 */
const scheduleFollowUpNotification = async (reminder: FollowUpReminder): Promise<string | null> => {
  try {
    const dueDate = new Date(reminder.dueDate);
    const now = new Date();

    // Don't schedule if the due date is in the past
    if (dueDate <= now) {
      console.warn('Cannot schedule notification for follow-up reminder in the past');
      return null;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted for follow-up reminder');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.type === 'application' 
          ? `📋 Follow Up: ${reminder.company}`
          : `💼 Interview Follow-Up: ${reminder.company}`,
        body: reminder.type === 'application'
          ? `Time to check if the ${reminder.positionTitle} position is still open`
          : `Follow up with ${reminder.company} about next steps`,
        sound: true,
        data: { reminderId: reminder.id, type: 'followup' },
      },
      trigger: dueDate,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling follow-up notification:', error);
    return null;
  }
};

/**
 * Create a follow-up reminder for an application
 * @param applicationId - ID of the job application
 * @param company - Company name
 * @param positionTitle - Position title
 * @param daysFromNow - Number of days from now to schedule the reminder
 * @returns The created follow-up reminder
 */
export const createApplicationFollowUp = async (
  applicationId: string,
  company: string,
  positionTitle: string,
  daysFromNow: number
): Promise<FollowUpReminder> => {
  try {
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + daysFromNow);
    dueDate.setHours(9, 0, 0, 0); // Set to 9 AM on the due date

    const reminder: FollowUpReminder = {
      id: generateFollowUpId(),
      applicationId,
      type: 'application',
      dueDate: dueDate.toISOString(),
      company,
      positionTitle,
      completed: false,
      createdAt: now.toISOString(),
    };

    // Schedule notification
    const notificationId = await scheduleFollowUpNotification(reminder);
    if (notificationId) {
      reminder.notificationId = notificationId;
    }

    await saveFollowUpReminder(reminder);
    return reminder;
  } catch (error) {
    console.error('Error creating application follow-up:', error);
    throw error;
  }
};

/**
 * Create a follow-up reminder for an interview
 * @param applicationId - ID of the job application
 * @param company - Company name
 * @param positionTitle - Position title
 * @param daysFromNow - Number of days from now to schedule the reminder
 * @returns The created follow-up reminder, or null if a thank you note has been sent
 */
export const createInterviewFollowUp = async (
  applicationId: string,
  company: string,
  positionTitle: string,
  daysFromNow: number
): Promise<FollowUpReminder | null> => {
  try {
    // Check if there's a thank you note (pending or sent) for this application
    const { getAllEvents } = await import('./events');
    const allEvents = await getAllEvents();
    const interviewEvents = allEvents.filter(
      e => e.type === 'interview' && 
      e.applicationId === applicationId &&
      (e.thankYouNoteStatus === 'sent' || e.thankYouNoteStatus === 'pending')
    );
    
    // If a thank you note exists (pending or sent), don't create a follow-up reminder
    if (interviewEvents.length > 0) {
      return null;
    }

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + daysFromNow);
    dueDate.setHours(9, 0, 0, 0); // Set to 9 AM on the due date

    const reminder: FollowUpReminder = {
      id: generateFollowUpId(),
      applicationId,
      type: 'interview',
      dueDate: dueDate.toISOString(),
      company,
      positionTitle,
      completed: false,
      createdAt: now.toISOString(),
    };

    // Schedule notification
    const notificationId = await scheduleFollowUpNotification(reminder);
    if (notificationId) {
      reminder.notificationId = notificationId;
    }

    await saveFollowUpReminder(reminder);
    return reminder;
  } catch (error) {
    console.error('Error creating interview follow-up:', error);
    throw error;
  }
};

/**
 * Delete all follow-up reminders for an application (when application is deleted)
 */
export const deleteFollowUpRemindersForApplication = async (applicationId: string): Promise<void> => {
  try {
    const reminders = await getFollowUpRemindersForApplication(applicationId);
    for (const reminder of reminders) {
      await deleteFollowUpReminder(reminder.id);
    }
  } catch (error) {
    console.error('Error deleting follow-up reminders for application:', error);
    throw error;
  }
};

