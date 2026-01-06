import * as Notifications from 'expo-notifications';
import { Event } from './events';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule a notification for 10 minutes before an event
 */
export const scheduleEventNotification = async (event: Event): Promise<string | null> => {
  try {
    // Parse event date and time (using local time components to avoid timezone issues)
    const [year, month, day] = event.dateKey.split('-').map(Number);
    const [hours, minutes] = event.startTime.split(':').map(Number);
    
    // Create event date using local time components
    const eventDate = new Date(year, month - 1, day, hours, minutes);
    
    // Calculate notification time (10 minutes before)
    const notificationDate = new Date(eventDate.getTime() - 10 * 60 * 1000);
    
    const now = new Date();
    
    // Don't schedule if the notification time is in the past
    if (notificationDate <= now) {
      console.warn('Cannot schedule notification in the past or at current time');
      return null;
    }

    // Only request permissions if we're actually going to schedule a notification
    // This avoids showing the permission dialog unnecessarily
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return null;
    }

    // Schedule notification with Date object as trigger
    // expo-notifications accepts a Date object directly for absolute time scheduling
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${event.title}`,
        body: `Your ${event.type} starts in 10 minutes`,
        sound: true,
        data: { eventId: event.id },
      },
      trigger: notificationDate, // Date object representing when to trigger the notification
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelEventNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

/**
 * Schedule a reminder to send a thank you note after an interview
 * @param event - The interview event
 * @param daysAfterInterview - Number of days after interview to send reminder (default from preferences)
 */
export const scheduleThankYouNoteReminder = async (
  event: Event,
  daysAfterInterview: number = 2
): Promise<string | null> => {
  try {
    if (event.type !== 'interview') {
      console.warn('Can only schedule thank you note reminders for interview events');
      return null;
    }

    // Parse event date and time
    const [year, month, day] = event.dateKey.split('-').map(Number);
    const [hours, minutes] = event.startTime.split(':').map(Number);
    
    // Create event date using local time components
    const eventDate = new Date(year, month - 1, day, hours, minutes);
    
    // Calculate reminder time (X days after interview, at 9 AM)
    const reminderDate = new Date(eventDate);
    reminderDate.setDate(reminderDate.getDate() + daysAfterInterview);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM
    
    const now = new Date();
    
    // Don't schedule if the reminder time is in the past
    if (reminderDate <= now) {
      console.warn('Cannot schedule reminder in the past');
      return null;
    }

    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return null;
    }

    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📧 Send Thank You Note',
        body: `Don't forget to send a thank you note for your interview at ${event.company || 'the company'}!`,
        sound: true,
        data: { 
          eventId: event.id,
          applicationId: event.applicationId,
          type: 'thank-you-reminder'
        },
      },
      trigger: reminderDate,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling thank you note reminder:', error);
    return null;
  }
};

/**
 * Cancel all notifications (useful for cleanup)
 */

