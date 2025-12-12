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
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return null;
    }

    // Parse event date and time
    const [year, month, day] = event.dateKey.split('-').map(Number);
    const [hours, minutes] = event.startTime.split(':').map(Number);
    
    // Create event date
    const eventDate = new Date(year, month - 1, day, hours, minutes);
    
    // Calculate notification time (10 minutes before)
    const notificationDate = new Date(eventDate.getTime() - 10 * 60 * 1000);
    
    // Don't schedule if the notification time is in the past
    if (notificationDate < new Date()) {
      console.warn('Cannot schedule notification in the past');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${event.title}`,
        body: `Your ${event.type} starts in 10 minutes`,
        sound: true,
        data: { eventId: event.id },
      },
      trigger: notificationDate,
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
 * Cancel all notifications (useful for cleanup)
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

/**
 * Reschedule notification for an updated event
 */
export const rescheduleEventNotification = async (event: Event): Promise<string | null> => {
  try {
    // Cancel old notification if it exists
    if (event.notificationId) {
      await cancelEventNotification(event.notificationId);
    }
    
    // Schedule new notification
    return await scheduleEventNotification(event);
  } catch (error) {
    console.error('Error rescheduling notification:', error);
    return null;
  }
};

