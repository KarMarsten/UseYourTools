import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, BackHandler, Platform, Alert } from 'react-native';
import { getDayThemeForDate, getDayName } from '../utils/plannerData';
import { hasEntriesForDate } from '../utils/entryChecker';
import { loadEventsForDate, Event } from '../utils/events';
import { usePreferences } from '../context/PreferencesContext';
import { formatTimeRange, formatTime12Hour, getDateKey } from '../utils/timeFormatter';
import { openAddressInMaps, openPhoneNumber, openEmail } from '../utils/eventActions';

interface CalendarScreenProps {
  onSelectDate: (date: Date) => void;
  onBack?: () => void;
  onSettings?: () => void;
  onReports?: () => void;
  refreshTrigger?: number; // Optional trigger to refresh entry indicators
}

export default function CalendarScreen({ onSelectDate, onBack, onSettings, onReports, refreshTrigger }: CalendarScreenProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysWithEntries, setDaysWithEntries] = useState<Set<string>>(new Set());
  const [daysWithEvents, setDaysWithEvents] = useState<Set<string>>(new Set());

  const handleExit = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Exit App',
        'Are you sure you want to exit?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => BackHandler.exitApp(),
          },
        ]
      );
    } else {
      // iOS doesn't support programmatic exit, but we can show a message
      Alert.alert('Exit App', 'On iOS, you can exit by swiping up from the bottom and swiping the app away.');
    }
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const initialLoadRef = useRef(false);
  const { colorScheme, preferences } = usePreferences();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const use12Hour = preferences?.use12HourClock ?? false;

  // On initial load, automatically select today if it's in the current month
  useEffect(() => {
    if (!initialLoadRef.current) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      if (todayDate.getMonth() === currentMonth && todayDate.getFullYear() === currentYear) {
        setSelectedDate(todayDate);
      }
      initialLoadRef.current = true;
    }
  }, [currentDate]);

  useEffect(() => {
    checkEntriesForMonth();
    checkEventsForMonth();
  }, [currentDate, refreshTrigger]);

  useEffect(() => {
    if (selectedDate) {
      loadSelectedDayEvents();
    }
  }, [selectedDate, refreshTrigger]);

  const checkEntriesForMonth = async () => {
    const days = getDaysInMonth(currentDate);
    const entriesSet = new Set<string>();
    
    // Check entries for all days in the current month
    for (const day of days) {
      if (day.getMonth() === currentDate.getMonth()) {
        const hasEntries = await hasEntriesForDate(day);
        if (hasEntries) {
          entriesSet.add(getDateKey(day));
        }
      }
    }
    
    setDaysWithEntries(entriesSet);
  };

  const checkEventsForMonth = async () => {
    const days = getDaysInMonth(currentDate);
    const eventsSet = new Set<string>();
    
    // Check events for all days in the current month
    for (const day of days) {
      if (day.getMonth() === currentDate.getMonth()) {
        const dateKey = getDateKey(day);
        const events = await loadEventsForDate(dateKey);
        if (events.length > 0) {
          eventsSet.add(dateKey);
        }
      }
    }
    
    setDaysWithEvents(eventsSet);
  };

  const loadSelectedDayEvents = async () => {
    if (!selectedDate) return;
    const dateKey = getDateKey(selectedDate);
    const events = await loadEventsForDate(dateKey);
    setSelectedEvents(events);
  };

  const handleDayPress = (date: Date) => {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    setSelectedDate(normalizedDate);
    // Load events for selected date - don't navigate immediately
    // User can click "Open Planner" button to navigate
  };

  const handleOpenPlanner = () => {
    if (selectedDate) {
      onSelectDate(selectedDate);
    }
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    firstDay.setHours(0, 0, 0, 0); // Normalize to midnight
    const lastDay = new Date(year, month + 1, 0);
    lastDay.setHours(0, 0, 0, 0); // Normalize to midnight
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];
    
    // Add empty cells for days before the first day of the month
    // Use negative day indices to get previous month's days in chronological order (oldest to newest)
    // For startingDayOfWeek=3, we need: -2, -1, -0 (third-to-last, second-to-last, last day)
    for (let i = 0; i < startingDayOfWeek; i++) {
      const day = new Date(year, month, -(startingDayOfWeek - 1 - i));
      day.setHours(0, 0, 0, 0); // Normalize to midnight
      days.push(day);
    }

    // Add all days of the month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const day = new Date(year, month, dayNum);
      day.setHours(0, 0, 0, 0); // Normalize to midnight
      days.push(day);
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1);
    setCurrentDate(newMonth);
    // Clear selected date when month changes, then auto-select today if it's in the new month
    setSelectedDate(null);
    setSelectedEvents([]);
    // Auto-select today if navigating to the month containing today
    if (today.getMonth() === newMonth.getMonth() && today.getFullYear() === newMonth.getFullYear()) {
      setTimeout(() => {
        setSelectedDate(today);
      }, 100); // Small delay to ensure month has loaded
    }
  };

  const isToday = (date: Date): boolean => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const days = getDaysInMonth(currentDate);

  const dynamicStyles = {
    container: { backgroundColor: colorScheme.colors.background },
    header: { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border },
    title: { color: colorScheme.colors.text },
    backButtonText: { color: colorScheme.colors.primary },
    calendarHeader: { backgroundColor: colorScheme.colors.surface },
    navButtonText: { color: colorScheme.colors.primary },
    monthYear: { color: colorScheme.colors.text },
    weekDaysContainer: { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border },
    weekDayText: { color: colorScheme.colors.textSecondary },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, dynamicStyles.backButtonText]}>← Home</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={[styles.title, dynamicStyles.title]}>🌿 Calendar</Text>
        </View>
        <View style={styles.headerRight}>
          {onReports && (
            <TouchableOpacity onPress={onReports} style={styles.reportsButton}>
              <Text style={[styles.reportsIcon, { color: colorScheme.colors.text }]}>📊</Text>
            </TouchableOpacity>
          )}
          {onSettings && (
            <TouchableOpacity onPress={onSettings} style={styles.settingsButton}>
              <Text style={[styles.settingsIcon, { color: colorScheme.colors.text }]}>⚙️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
            <Text style={[styles.exitIcon, { color: colorScheme.colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.calendarHeader, dynamicStyles.calendarHeader]}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
          <Text style={[styles.navButtonText, dynamicStyles.navButtonText]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.monthYear, dynamicStyles.monthYear]}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
          <Text style={[styles.navButtonText, dynamicStyles.navButtonText]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.weekDaysContainer, dynamicStyles.weekDaysContainer]}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekDay}>
            <Text style={[styles.weekDayText, dynamicStyles.weekDayText]}>{day}</Text>
          </View>
        ))}
      </View>

      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colorScheme.colors.background }]} 
        contentContainerStyle={[styles.calendarGrid, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {days.map((date, index) => {
          // Ensure date is normalized (defensive check)
          const normalizedDate = new Date(date);
          normalizedDate.setHours(0, 0, 0, 0);
          const dayNumber = normalizedDate.getDate();
          const isTodayDate = isToday(normalizedDate);
          const isCurrentMonthDate = isCurrentMonth(normalizedDate);
          const dateKey = getDateKey(normalizedDate);
          const hasEntries = daysWithEntries.has(dateKey);
          const hasEvents = daysWithEvents.has(dateKey);
          const isSelected = selectedDate && dateKey === getDateKey(selectedDate);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                {
                  backgroundColor: isCurrentMonthDate 
                    ? (isTodayDate ? colorScheme.colors.primary : 
                       isSelected ? colorScheme.colors.accent : colorScheme.colors.surface)
                    : colorScheme.colors.background,
                  borderColor: isTodayDate ? colorScheme.colors.text : 
                              isSelected ? colorScheme.colors.primary : colorScheme.colors.border,
                  opacity: !isCurrentMonthDate ? 0.3 : 1,
                  borderWidth: (isTodayDate || isSelected) ? 2 : 1,
                },
              ]}
              onPress={() => handleDayPress(normalizedDate)}
            >
              <View style={styles.dayContent}>
                <View style={styles.dayNumberContainer}>
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: isCurrentMonthDate ? colorScheme.colors.text : colorScheme.colors.textSecondary },
                      isTodayDate && { color: colorScheme.colors.background, fontWeight: 'bold' },
                    ]}
                  >
                    {isCurrentMonthDate ? dayNumber : ''}
                  </Text>
                </View>
                {isCurrentMonthDate && (hasEntries || hasEvents) && (
                  <View style={styles.indicatorsContainer}>
                    {hasEntries && (
                      <Text style={styles.indicatorIcon}>✏️</Text>
                    )}
                    {hasEvents && (
                      <Text style={styles.indicatorIcon}>💬</Text>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Events section for selected day */}
      {selectedDate && (
        <View style={[styles.eventsContainer, { backgroundColor: colorScheme.colors.background, borderTopColor: colorScheme.colors.border }]}>
          <View style={[styles.eventsHeader, { borderBottomColor: colorScheme.colors.border }]}>
            <Text style={[styles.eventsTitle, { color: colorScheme.colors.text }]}>
              Events for {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={handleOpenPlanner}
              style={[styles.openPlannerButton, { backgroundColor: colorScheme.colors.primary }]}
            >
              <Text style={styles.openPlannerButtonText}>Open Planner →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.eventsScrollView}>
            {selectedEvents.length === 0 ? (
              <View style={styles.noEventsContainer}>
                <Text style={[styles.noEventsText, { color: colorScheme.colors.textSecondary }]}>
                  No events scheduled for this day
                </Text>
              </View>
            ) : (
              selectedEvents.map((event) => (
              <View
                key={event.id}
                style={[
                  styles.eventCard,
                  {
                    backgroundColor: colorScheme.colors.surface,
                    borderColor: colorScheme.colors.border,
                  },
                ]}
              >
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTitle, { color: colorScheme.colors.text }]}>
                    {event.type === 'interview' ? '💼' : event.type === 'appointment' ? '📅' : '🔔'} {event.title}
                  </Text>
                  <Text style={[styles.eventTime, { color: colorScheme.colors.primary }]}>
                    {event.endTime 
                      ? formatTimeRange(`${event.startTime}–${event.endTime}`, use12Hour)
                      : formatTime12Hour(event.startTime)}
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
                          onPress={() => {
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
                          onPress={() => openEmail(event.email!)}
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
                          onPress={() => {
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
              </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#E7D7C1',
    borderBottomWidth: 1,
    borderBottomColor: '#C9A66B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#8C6A4A',
    fontWeight: '600',
  },
  headerContent: {
    marginTop: 10,
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8b7355',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  settingsButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
  exitButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  reportsButton: {
    padding: 8,
    marginRight: 8,
  },
  reportsIcon: {
    fontSize: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E7D7C1',
  },
  navButton: {
    padding: 10,
    minWidth: 44,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: '#8C6A4A',
    fontWeight: 'bold',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A3A2A',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    backgroundColor: '#E7D7C1',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#C9A66B',
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b5b4f',
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: 'transparent', // Will be overridden by scrollView background
  },
  calendarDay: {
    width: '14.2857%', // More precise: 100/7
    aspectRatio: 1,
    padding: 4,
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 8,
  },
  dayContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  dayNumberContainer: {
    paddingTop: 4,
    paddingLeft: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
  },
  dayNumberOtherMonth: {
    color: '#a0826d',
  },
  dayNumberToday: {
    color: '#f5f5dc',
    fontWeight: 'bold',
  },
  indicatorsContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    flexDirection: 'row',
    gap: 2,
  },
  indicatorIcon: {
    fontSize: 10,
  },
  noEventsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noEventsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  eventsContainer: {
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: '#C9A66B',
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#C9A66B',
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  openPlannerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openPlannerButtonText: {
    color: '#FFF8E7',
    fontSize: 14,
    fontWeight: '600',
  },
  eventsScrollView: {
    maxHeight: 250,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  noEventsText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

