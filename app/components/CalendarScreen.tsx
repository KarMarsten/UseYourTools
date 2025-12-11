import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { getDayThemeForDate, getDayName } from '../utils/plannerData';
import { hasEntriesForDate } from '../utils/entryChecker';
import { usePreferences } from '../context/PreferencesContext';

interface CalendarScreenProps {
  onSelectDate: (date: Date) => void;
  onBack?: () => void;
  refreshTrigger?: number; // Optional trigger to refresh entry indicators
}

export default function CalendarScreen({ onSelectDate, onBack, refreshTrigger }: CalendarScreenProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysWithEntries, setDaysWithEntries] = useState<Set<string>>(new Set());
  const { colorScheme } = usePreferences();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    checkEntriesForMonth();
  }, [currentDate, refreshTrigger]);

  const checkEntriesForMonth = async () => {
    const days = getDaysInMonth(currentDate);
    const entriesSet = new Set<string>();
    
    // Check entries for all days in the current month
    for (const day of days) {
      if (day.getMonth() === currentDate.getMonth()) {
        const hasEntries = await hasEntriesForDate(day);
        if (hasEntries) {
          entriesSet.add(day.toISOString().split('T')[0]);
        }
      }
    }
    
    setDaysWithEntries(entriesSet);
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(year, month, -startingDayOfWeek + i + 1));
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
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
        contentContainerStyle={styles.calendarGrid}
      >
        {days.map((date, index) => {
          const dayTheme = getDayThemeForDate(date);
          const dayNumber = date.getDate();
          const isTodayDate = isToday(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const dateKey = date.toISOString().split('T')[0];
          const hasEntries = daysWithEntries.has(dateKey);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                {
                  backgroundColor: isCurrentMonthDate 
                    ? (isTodayDate ? colorScheme.colors.primary : colorScheme.colors.surface)
                    : colorScheme.colors.background,
                  borderColor: isTodayDate ? colorScheme.colors.text : colorScheme.colors.border,
                  opacity: !isCurrentMonthDate ? 0.3 : 1,
                  borderWidth: isTodayDate ? 2 : 1,
                },
              ]}
              onPress={() => onSelectDate(date)}
            >
              <Text
                style={[
                  styles.dayNumber,
                  { color: isCurrentMonthDate ? colorScheme.colors.text : colorScheme.colors.textSecondary },
                  isTodayDate && { color: colorScheme.colors.background, fontWeight: 'bold' },
                ]}
              >
                {isCurrentMonthDate ? dayNumber : ''}
              </Text>
              {isCurrentMonthDate && (
                <>
                  <View style={[styles.dayThemeIndicator, { backgroundColor: colorScheme.colors.secondary }]}>
                    <Text style={[styles.dayThemeText, { color: colorScheme.colors.text }]} numberOfLines={1}>
                      {dayTheme.theme.split(' ')[0]}
                    </Text>
                  </View>
                  {hasEntries && (
                    <View style={styles.entryIndicator}>
                      <View style={[styles.entryDot, { backgroundColor: colorScheme.colors.primary }]} />
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  headerContent: {
    marginTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8b7355',
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
    width: '14.28%',
    aspectRatio: 1,
    padding: 8,
    margin: 1,
    borderRadius: 8,
    justifyContent: 'space-between',
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
  dayThemeIndicator: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 4,
  },
  dayThemeText: {
    fontSize: 9,
    fontWeight: '500',
  },
  entryIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  entryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8C6A4A',
  },
});

