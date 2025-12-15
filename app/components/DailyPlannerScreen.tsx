import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDayThemeForDate, getDayName } from '../utils/plannerData';
import { loadPreferences } from '../utils/preferences';
import { generateTimeBlocks, GeneratedTimeBlock } from '../utils/timeBlockGenerator';
import { usePreferences } from '../context/PreferencesContext';
import { formatTimeRange, formatTime12Hour } from '../utils/timeFormatter';
import { Event, loadEventsForDate, saveEvent, deleteEvent } from '../utils/events';
import { getApplicationById, addApplicationEventId } from '../utils/applications';
import { scheduleEventNotification, cancelEventNotification } from '../utils/eventNotifications';
import { openAddressInMaps, openPhoneNumber, openEmail } from '../utils/eventActions';
import { getDateKey } from '../utils/timeFormatter';
import AddEventModal from './AddEventModal';

interface DailyPlannerScreenProps {
  date: Date;
  onBack: () => void;
  initialApplicationId?: string;
}

interface DayEntries {
  [timeBlockId: string]: string;
}

export default function DailyPlannerScreen({ date, onBack, initialApplicationId }: DailyPlannerScreenProps) {
  const [entries, setEntries] = useState<DayEntries>({});
  const [timeBlocks, setTimeBlocks] = useState<GeneratedTimeBlock[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
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
    } catch (error) {
      console.error('Error loading events:', error);
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

      await saveEvent(event);

      // If we have initialApplicationData, add the eventId to the application's eventIds array
      if (initialApplicationData && event.type === 'interview') {
        await addApplicationEventId(initialApplicationData.id, event.id);
      }

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
    <View style={[styles.container, dynamicStyles.container]}>
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
        </View>

        <View style={[styles.divider, dynamicStyles.divider]} />

        {/* Display Events */}
        {events.length > 0 && (
          <View style={styles.eventsSection}>
            <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>Events</Text>
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
                  <Text style={[styles.eventTime, { color: colorScheme.colors.primary }]}>
                    {event.endTime 
                      ? formatTimeRange(`${event.startTime}–${event.endTime}`, use12Hour)
                      : use12Hour ? formatTime12Hour(event.startTime) : event.startTime}
                  </Text>
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
                    • {block.description}
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
              <View style={styles.handwritingLines}>
                <View style={[styles.line, { backgroundColor: colorScheme.colors.border }]} />
                <View style={[styles.line, { backgroundColor: colorScheme.colors.border }]} />
              </View>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  timeBlockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
    marginRight: 8,
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
  handwritingLines: {
    marginTop: 4,
  },
  line: {
    height: 1,
    marginBottom: 8,
    opacity: 0.5,
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

