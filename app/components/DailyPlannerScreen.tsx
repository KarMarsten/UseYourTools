import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDayThemeForDate, getDayName } from '../utils/plannerData';
import { getDailyQuote } from '../utils/dailyQuotes';
import { loadPreferences } from '../utils/preferences';
import { generateTimeBlocks, GeneratedTimeBlock } from '../utils/timeBlockGenerator';
import { usePreferences } from '../context/PreferencesContext';
import { formatTimeRange, formatTime12Hour } from '../utils/timeFormatter';
import { Event, loadEventsForDate, saveEvent, deleteEvent, getAllEvents } from '../utils/events';
import { getApplicationById, getAllApplications } from '../utils/applications';
import { getAllFollowUpReminders, FollowUpReminder } from '../utils/followUpReminders';
import { scheduleEventNotification, cancelEventNotification } from '../utils/eventNotifications';
import { openAddressInMaps, openPhoneNumber, openEmail } from '../utils/eventActions';
import { getDateKey } from '../utils/timeFormatter';
import AddEventModal from './AddEventModal';

interface DailyPlannerScreenProps {
  date: Date;
  onBack: () => void;
  onDateChange?: (newDate: Date) => void;
  initialApplicationId?: string;
  onNavigateToApplication?: (applicationId: string) => void;
}

interface DayEntries {
  [timeBlockId: string]: string;
}

export default function DailyPlannerScreen({ date, onBack, onDateChange, initialApplicationId, onNavigateToApplication }: DailyPlannerScreenProps) {
  const [entries, setEntries] = useState<DayEntries>({});
  const [timeBlocks, setTimeBlocks] = useState<GeneratedTimeBlock[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingThankYouNotes, setPendingThankYouNotes] = useState<Event[]>([]);
  const [followUpReminders, setFollowUpReminders] = useState<FollowUpReminder[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [viewingEvent, setViewingEvent] = useState<Event | undefined>(undefined);
  const [isViewMode, setIsViewMode] = useState(false);
  const [initialApplicationData, setInitialApplicationData] = useState<{ id: string; company?: string; positionTitle?: string; } | undefined>(undefined);
  const { preferences, colorScheme } = usePreferences();
  // Normalize date to ensure consistent dateKey calculation (avoid timezone issues)
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  const dateKey = getDateKey(normalizedDate);
  const dayTheme = getDayThemeForDate(normalizedDate);
  const dayName = getDayName(normalizedDate);
  
  const use12Hour = preferences?.use12HourClock ?? false;

  // PanResponder for swipe gestures - use useRef to memoize but update date reference
  const dateRef = useRef(date);
  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes (more horizontal than vertical)
        // Don't interfere with scrolling
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe
        
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD && onDateChange) {
          const currentDate = dateRef.current;
          if (gestureState.dx > 0) {
            // Swipe right - go to previous day
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);
            prevDate.setHours(0, 0, 0, 0);
            onDateChange(prevDate);
          } else {
            // Swipe left - go to next day
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);
            nextDate.setHours(0, 0, 0, 0);
            onDateChange(nextDate);
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    loadEntries();
    loadCustomTimeBlocks();
    loadEvents();
    // If we have an initialApplicationId, load the application and open the event modal
    if (initialApplicationId) {
      loadApplicationForEvent(initialApplicationId);
      setShowAddEventModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, preferences, initialApplicationId]); // Use dateKey instead of date to avoid re-running on date object reference changes

  const loadApplicationForEvent = async (applicationId: string) => {
    try {
      const application = await getApplicationById(applicationId);
      if (application) {
        setInitialApplicationData({
          id: application.id,
          company: application.company,
          positionTitle: application.positionTitle,
        });
      }
    } catch (error) {
      console.error('Error loading application for event:', error);
    }
  };

  const loadCustomTimeBlocks = async () => {
    try {
      const prefs = preferences || await loadPreferences();
      // Generate time blocks based on start/end times
      const generatedBlocks = generateTimeBlocks(prefs);
      setTimeBlocks(generatedBlocks);
    } catch (error) {
      console.error('Error loading custom time blocks:', error);
      // Use current preferences or fallback
      if (preferences) {
        setTimeBlocks(generateTimeBlocks(preferences));
      }
    }
  };

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(`planner_${dateKey}`);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        setEntries({});
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const loadedEvents = await loadEventsForDate(dateKey);
      setEvents(loadedEvents);
      
      // Load pending thank you notes for this date
      await loadPendingThankYouNotes();
      
      // Load follow-up reminders for this date
      await loadFollowUpReminders();
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadPendingThankYouNotes = async () => {
    try {
      const allEvents = await getAllEvents();
      const allApplications = await getAllApplications();
      const prefs = preferences || await loadPreferences();
      const daysAfterInterview = prefs.thankYouNoteDaysAfterInterview || 1; // Default to 1 day
      
      // Create a map of application IDs to their status for quick lookup
      const applicationStatusMap = new Map<string, string>();
      allApplications.forEach(app => {
        applicationStatusMap.set(app.id, app.status);
      });
      
      const pendingNotes = allEvents.filter(e => {
        if (e.type !== 'interview') {
          return false;
        }
        
        // Check if thank you note status is pending (undefined or 'pending')
        // If it's 'sent' or 'skipped', don't show it
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
        const dueDateKey = getDateKey(dueDate);
        
        // Show ONLY if due on the exact date being viewed
        return dueDateKey === dateKey;
      });
      
      setPendingThankYouNotes(pendingNotes);
    } catch (error) {
      console.error('Error loading pending thank you notes:', error);
    }
  };

  const loadFollowUpReminders = async () => {
    try {
      const allReminders = await getAllFollowUpReminders();
      const allApplications = await getAllApplications();
      const allEvents = await getAllEvents();
      
      // Create a map of application IDs to their status for quick lookup
      const applicationStatusMap = new Map<string, string>();
      allApplications.forEach(app => {
        applicationStatusMap.set(app.id, app.status);
      });
      
      // Create a set of applications that have thank you notes (pending or sent)
      const applicationsWithThankYouNotes = new Set<string>();
      allEvents.forEach(event => {
        if (event.type === 'interview' && 
            event.applicationId && 
            (event.thankYouNoteStatus === 'sent' || event.thankYouNoteStatus === 'pending')) {
          applicationsWithThankYouNotes.add(event.applicationId);
        }
      });
      
      const remindersForDate = allReminders.filter(reminder => {
        if (reminder.completed) return false;
        
        // Skip if the linked application is rejected
        const appStatus = applicationStatusMap.get(reminder.applicationId);
        if (appStatus === 'rejected') {
          return false;
        }
        
        // Skip if a thank you note exists (pending or sent) for this application
        // This applies to all follow-up reminders (both application and interview types)
        if (reminder.applicationId && applicationsWithThankYouNotes.has(reminder.applicationId)) {
          return false;
        }
        
        const reminderDate = new Date(reminder.dueDate);
        const reminderDateKey = getDateKey(reminderDate);
        
        // Show ONLY if due on the exact date being viewed
        return reminderDateKey === dateKey;
      });
      setFollowUpReminders(remindersForDate);
    } catch (error) {
      console.error('Error loading follow-up reminders:', error);
    }
  };

  const handleSaveEvent = async (event: Event) => {
    try {
      // If editing, cancel old notification first
      if (editingEvent?.notificationId) {
        await cancelEventNotification(editingEvent.notificationId);
      }
      
      // Schedule notification 10 minutes before event
      const notificationId = await scheduleEventNotification(event);
      if (notificationId) {
        event.notificationId = notificationId;
      }

      // If we have initialApplicationData, link the event and application
      if (initialApplicationData && event.type === 'interview') {
        event.applicationId = initialApplicationData.id;
      }

      // Save event (bi-directional linking is handled by saveEvent)
      await saveEvent(event);

      await loadEvents(); // Reload events to update UI
      setEditingEvent(undefined);
      setViewingEvent(undefined);
      setIsViewMode(false);
      setShowAddEventModal(false);
      setInitialApplicationData(undefined); // Clear the initial application data
      // Note: Calendar refresh will happen when user navigates back
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    }
  };

  const handleViewEvent = (event: Event) => {
    setViewingEvent(event);
    setIsViewMode(true);
    setShowAddEventModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsViewMode(false);
    setShowAddEventModal(true);
  };

  const handleSwitchToEdit = () => {
    if (viewingEvent) {
      setEditingEvent(viewingEvent);
      setIsViewMode(false);
      setViewingEvent(undefined);
    }
  };

  const handleCloseModal = () => {
    setShowAddEventModal(false);
    setEditingEvent(undefined);
    setViewingEvent(undefined);
    setIsViewMode(false);
    setInitialApplicationData(undefined); // Clear initial application data when closing
  };

  const handleDeleteEvent = async (event: Event) => {
    try {
      // Cancel notification if it exists
      if (event.notificationId) {
        await cancelEventNotification(event.notificationId);
      }
      await deleteEvent(event.id);
      await loadEvents(); // Reload events to update UI
      // Note: Calendar refresh will happen when user navigates back
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    }
  };

  const saveEntry = async (timeBlockId: string, text: string) => {
    const newEntries = { ...entries, [timeBlockId]: text };
    setEntries(newEntries);
    try {
      await AsyncStorage.setItem(`planner_${dateKey}`, JSON.stringify(newEntries));
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const dynamicStyles = {
    container: { backgroundColor: colorScheme.colors.background },
    header: { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border },
    backButtonText: { color: colorScheme.colors.primary },
    dayName: { color: colorScheme.colors.text },
    dateText: { color: colorScheme.colors.textSecondary },
    themeContainer: { backgroundColor: colorScheme.colors.secondary },
    themeText: { color: colorScheme.colors.text },
    divider: { backgroundColor: colorScheme.colors.border },
    textInput: { backgroundColor: colorScheme.colors.background, borderColor: colorScheme.colors.border },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]} {...panResponder.panHandlers}>
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, dynamicStyles.backButtonText]}>← Calendar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderTop}>
            <View style={styles.dayHeaderLeft}>
              <Text style={[styles.dayName, dynamicStyles.dayName]}>{dayName}</Text>
              <Text style={[styles.dateText, dynamicStyles.dateText]}>{formatDate(date)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colorScheme.colors.primary }]}
              onPress={() => setShowAddEventModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Event</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.themeContainer, dynamicStyles.themeContainer]}>
            <Text style={styles.themeLabel}>🌿</Text>
            <Text style={[styles.themeText, dynamicStyles.themeText]}>{dayTheme.theme}</Text>
          </View>
          {/* Daily Quote */}
          {preferences?.showZenQuotes !== false && (() => {
            const dailyQuote = getDailyQuote(normalizedDate);
            return (
              <View style={[styles.quoteContainer, { backgroundColor: colorScheme.colors.background, borderColor: colorScheme.colors.border }]}>
                <Text style={[styles.quoteText, { color: colorScheme.colors.text }]}>
                  "{dailyQuote.quote}"
                </Text>
                {dailyQuote.author && (
                  <Text style={[styles.quoteAuthor, { color: colorScheme.colors.textSecondary }]}>
                    — {dailyQuote.author}
                  </Text>
                )}
              </View>
            );
          })()}
        </View>

        <View style={[styles.divider, dynamicStyles.divider]} />

        {/* Display Events */}
        {(events.length > 0 || pendingThankYouNotes.length > 0 || followUpReminders.length > 0) && (
          <View style={styles.eventsSection}>
            <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>Events</Text>
            {/* Display pending thank you notes */}
            {pendingThankYouNotes.map((event) => (
              <TouchableOpacity
                key={`thankyou-${event.id}`}
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: colorScheme.colors.surface,
                    borderColor: '#FFA500', // Orange border for pending thank you notes
                    borderWidth: 2,
                  },
                ]}
                onPress={() => {
                  // Navigate to application if linked, otherwise show event
                  if (event.applicationId && onNavigateToApplication) {
                    onNavigateToApplication(event.applicationId);
                  } else {
                    handleViewEvent(event);
                  }
                }}
              >
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: colorScheme.colors.text }]}>
                      💌 Send Thank You Note: {event.title}
                    </Text>
                  </View>
                  <Text style={[styles.eventTime, { color: '#FFA500' }]}>
                    Pending Thank You Note
                  </Text>
                  {event.company && (
                    <Text style={[styles.eventDetailText, { color: colorScheme.colors.textSecondary }]}>
                      🏢 {event.company}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
            {/* Display follow-up reminders */}
            {followUpReminders.map((reminder) => (
              <TouchableOpacity
                key={`followup-${reminder.id}`}
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: colorScheme.colors.surface,
                    borderColor: '#4CAF50', // Green border for follow-up reminders
                    borderWidth: 2,
                  },
                ]}
                onPress={() => {
                  // Navigate to application screen
                  if (reminder.applicationId && onNavigateToApplication) {
                    onNavigateToApplication(reminder.applicationId);
                  } else {
                    Alert.alert(
                      'Follow-Up Reminder',
                      `${reminder.type === 'interview' ? 'Interview' : 'Application'} follow-up for ${reminder.company}`,
                      [
                        { text: 'OK', style: 'default' },
                      ]
                    );
                  }
                }}
              >
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: colorScheme.colors.text }]}>
                      {reminder.type === 'interview' ? '💼' : '📋'} Follow-Up: {reminder.company}
                    </Text>
                  </View>
                  <Text style={[styles.eventTime, { color: '#4CAF50' }]}>
                    {reminder.type === 'interview' ? 'Interview' : 'Application'} Follow-Up Reminder
                  </Text>
                  <Text style={[styles.eventDetailText, { color: colorScheme.colors.textSecondary }]}>
                    💼 {reminder.positionTitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {/* Display regular events */}
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: colorScheme.colors.surface,
                    borderColor: colorScheme.colors.border,
                  },
                ]}
                onPress={() => handleViewEvent(event)}
              >
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: colorScheme.colors.text }]}>
                      {event.type === 'interview' ? '💼' : event.type === 'appointment' ? '📅' : '🔔'} {event.title}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event);
                      }}
                      style={styles.deleteButton}
                    >
                      <Text style={[styles.deleteButtonText, { color: colorScheme.colors.textSecondary }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                  <View>
                    <Text style={[styles.eventTime, { color: colorScheme.colors.primary }]}>
                      {(() => {
                        // Parse dateKey to create a Date object
                        const [year, month, day] = event.dateKey.split('-').map(Number);
                        const eventDate = new Date(year, month - 1, day);
                        const formattedDate = formatDate(eventDate);
                        return formattedDate;
                      })()}
                    </Text>
                    <Text style={[styles.eventTime, { color: colorScheme.colors.primary }]}>
                      {event.endTime 
                        ? formatTimeRange(`${event.startTime}–${event.endTime}`, use12Hour)
                        : use12Hour ? formatTime12Hour(event.startTime) : event.startTime}
                    </Text>
                  </View>
                  <Text style={[styles.eventType, { color: colorScheme.colors.textSecondary }]}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </Text>
                  
                  {/* Display contact information for interviews/appointments */}
                  {event.type !== 'reminder' && (
                    <View style={styles.eventDetails}>
                      {event.company && (
                        <Text style={[styles.eventDetailText, { color: colorScheme.colors.text }]}>
                          🏢 {event.company}
                        </Text>
                      )}
                      {event.jobTitle && (
                        <Text style={[styles.eventDetailText, { color: colorScheme.colors.text }]}>
                          💼 {event.jobTitle}
                        </Text>
                      )}
                      {event.contactName && (
                        <Text style={[styles.eventDetailText, { color: colorScheme.colors.text }]}>
                          👤 {event.contactName}
                        </Text>
                      )}
                      {event.address && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            const mapPref = preferences?.mapAppPreference || 'apple-maps';
                            openAddressInMaps(event.address!, mapPref);
                          }}
                        >
                          <View style={styles.eventDetailLinkContainer}>
                            <Text style={styles.eventDetailIcon}>📍</Text>
                            <Text style={[styles.eventDetailLink, { color: colorScheme.colors.text }]}>
                              {event.address}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      {event.email && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            openEmail(event.email!);
                          }}
                        >
                          <View style={styles.eventDetailLinkContainer}>
                            <Text style={styles.eventDetailIcon}>✉️</Text>
                            <Text style={[styles.eventDetailLink, { color: colorScheme.colors.text }]}>
                              {event.email}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      {event.phone && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={(e) => {
                            e.stopPropagation();
                            console.log('Phone number pressed:', event.phone);
                            openPhoneNumber(event.phone!);
                          }}
                        >
                          <View style={styles.eventDetailLinkContainer}>
                            <Text style={styles.eventDetailIcon}>📞</Text>
                            <Text style={[styles.eventDetailLink, { color: colorScheme.colors.text }]}>
                              {event.phone}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  
                  {/* Display notes for all event types */}
                  {event.notes && (
                    <Text style={[styles.eventNotes, { color: colorScheme.colors.textSecondary }]}>
                      {event.notes}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {events.length > 0 && <View style={[styles.divider, dynamicStyles.divider]} />}

        {timeBlocks.map((block) => (
          <View key={block.id} style={[
            styles.timeBlock,
            {
              backgroundColor: colorScheme.colors.surface,
              borderColor: colorScheme.colors.border,
            }
          ]}>
            <View style={styles.timeBlockHeader}>
              <Text style={[styles.timeText, { color: colorScheme.colors.primary }]}>
                {formatTimeRange(block.time, use12Hour)}
              </Text>
              <View style={styles.timeBlockTitleContainer}>
                <Text style={[styles.timeBlockTitle, { color: colorScheme.colors.text }]}>
                  🌿 {block.title}
                </Text>
                {block.description && (
                  <Text style={[styles.timeBlockDescription, { color: colorScheme.colors.textSecondary }]}>
                    {block.description}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, dynamicStyles.textInput, { color: colorScheme.colors.text }]}
                multiline
                placeholder="Write your plans here..."
                placeholderTextColor={colorScheme.colors.textSecondary}
                value={entries[block.id] || ''}
                onChangeText={(text) => saveEntry(block.id, text)}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      <AddEventModal
        visible={showAddEventModal}
        dateKey={dateKey}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        colorScheme={colorScheme.colors}
        use12Hour={use12Hour}
        event={isViewMode ? viewingEvent : editingEvent}
        viewMode={isViewMode}
        onEdit={handleSwitchToEdit}
        initialApplicationData={initialApplicationData}
        allowDateSelection={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#E7D7C1',
    borderBottomWidth: 1,
    borderBottomColor: '#C9A66B',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8C6A4A',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dayHeader: {
    marginBottom: 20,
  },
  dayName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A3A2A',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#6b5b4f',
    marginBottom: 16,
  },
  themeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9A66B',
    padding: 12,
    borderRadius: 8,
  },
  themeLabel: {
    fontSize: 18,
    marginRight: 8,
  },
  themeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
    flex: 1,
  },
  quoteContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 12,
    textAlign: 'right',
    width: '100%',
    fontStyle: 'normal',
  },
  divider: {
    height: 1,
    backgroundColor: '#C9A66B',
    marginVertical: 20,
  },
  timeBlock: {
    marginBottom: 24,
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  timeBlockHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C6A4A',
    width: 90,
    marginRight: 12,
  },
  timeBlockTitleContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  timeBlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
  },
  timeBlockDescription: {
    fontSize: 14,
    color: '#6b5b4f',
    fontStyle: 'italic',
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: '#f5f5dc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#4A3A2A',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#C9A66B',
    marginBottom: 8,
  },
  dayHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  addButtonText: {
    color: '#FFF8E7',
    fontSize: 14,
    fontWeight: '600',
  },
  eventsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  eventDetails: {
    marginTop: 8,
    gap: 6,
  },
  eventDetailText: {
    fontSize: 14,
    marginTop: 4,
  },
  eventDetailLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventDetailIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  eventDetailLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  eventNotes: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

