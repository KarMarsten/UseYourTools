import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Switch, Modal } from 'react-native';
import { TIME_BLOCKS, TimeBlock } from '../utils/plannerData';
import { UserPreferences, savePreferences, loadPreferences } from '../utils/preferences';
import { generateTimeBlocks, GeneratedTimeBlock } from '../utils/timeBlockGenerator';
import { COLOR_SCHEMES, ColorSchemeName, getColorScheme } from '../utils/colorSchemes';
import { formatTimeRange } from '../utils/timeFormatter';
import { usePreferences } from '../context/PreferencesContext';
import { syncAllEventsToCalendar, getGoogleCalendars } from '../utils/calendarSync';
import { getAllEvents } from '../utils/events';
import { exportAppData, importAppData } from '../utils/dataTransfer';
import * as Calendar from 'expo-calendar';

interface SetupScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

export default function SetupScreen({ onComplete, onBack }: SetupScreenProps) {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00'); // Will be auto-updated when start time changes
  const [timeBlockOrder, setTimeBlockOrder] = useState<string[]>(TIME_BLOCKS.map(b => b.id));
  const [use12HourClock, setUse12HourClock] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>('earth-tone');
  const [darkMode, setDarkMode] = useState(false);
  const [showZenQuotes, setShowZenQuotes] = useState(true);
  const [enableEmailTemplates, setEnableEmailTemplates] = useState(true);
  const [emailClient, setEmailClient] = useState<'default' | 'gmail'>('default');
  const [mapAppPreference, setMapAppPreference] = useState<'apple-maps' | 'google-maps'>('apple-maps');
  const [timezoneMode, setTimezoneMode] = useState<'device' | 'custom'>('device');
  const [timezone, setTimezone] = useState('');
  const [calendarSyncProvider, setCalendarSyncProvider] = useState<'none' | 'apple' | 'google'>('none');
  const [googleCalendarId, setGoogleCalendarId] = useState<string | undefined>(undefined);
  const [availableGoogleCalendars, setAvailableGoogleCalendars] = useState<Calendar.Calendar[]>([]);
  const [showGoogleCalendarPicker, setShowGoogleCalendarPicker] = useState(false);
  const [followUpDaysAfterApplication, setFollowUpDaysAfterApplication] = useState('7');
  const [followUpDaysAfterInterview, setFollowUpDaysAfterInterview] = useState('2');
  const [followUpDaysBetweenFollowUps, setFollowUpDaysBetweenFollowUps] = useState('2');
  const [thankYouNoteDaysAfterInterview, setThankYouNoteDaysAfterInterview] = useState('1');
  const [kanbanCardsPerColumn, setKanbanCardsPerColumn] = useState('5');
  const [homeFollowUpRemindersCount, setHomeFollowUpRemindersCount] = useState('2');
  const [loading, setLoading] = useState(true);
  const [showTimeBlockDropdown, setShowTimeBlockDropdown] = useState<number | null>(null); // Index of the time block being edited
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { refreshPreferences } = usePreferences();
  
  const currentColorScheme = getColorScheme(colorScheme, darkMode);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  // Load Google calendars when Google Calendar provider is selected
  useEffect(() => {
    if (calendarSyncProvider === 'google') {
      loadGoogleCalendars();
    }
  }, [calendarSyncProvider]);

  const loadGoogleCalendars = async () => {
    try {
      const calendars = await getGoogleCalendars();
      setAvailableGoogleCalendars(calendars);
      
      // Only auto-select first calendar if no calendar is currently selected in state
      // Don't override if user has already selected one or if one was loaded from preferences
      if (!googleCalendarId && calendars.length > 0) {
        // Check if we have a saved preference that exists in the current calendar list
        try {
          const prefs = await loadPreferences();
          if (prefs.googleCalendarId && calendars.some(cal => cal.id === prefs.googleCalendarId)) {
            // Use the saved preference if it still exists
            setGoogleCalendarId(prefs.googleCalendarId);
            return;
          }
        } catch (e) {
          // If we can't load preferences, continue with auto-selection
        }
        // Only auto-select if truly no selection exists
        setGoogleCalendarId(calendars[0].id);
      }
    } catch (error) {
      console.error('Error loading Google calendars:', error);
      Alert.alert('Error', 'Failed to load Google calendars. Please check calendar permissions.');
    }
  };

  // Auto-update end time when start time changes (9 hours later)
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    
    // Try to parse the time, even if incomplete
    const parts = newStartTime.split(':');
    if (parts.length === 2) {
      const startHours = parseInt(parts[0]) || 0;
      const startMinutes = parseInt(parts[1]) || 0;
      
      // Validate ranges
      if (startHours >= 0 && startHours < 24 && startMinutes >= 0 && startMinutes < 60) {
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = startTotalMinutes + (9 * 60); // Add 9 hours
        
        let endHours = Math.floor(endTotalMinutes / 60);
        const endMins = endTotalMinutes % 60;
        
        // Handle day wrap-around (if end time goes past midnight)
        if (endHours >= 24) {
          endHours = endHours % 24;
        }
        
        const newEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        setEndTime(newEndTime);
      }
    }
  };

  const loadUserPreferences = async () => {
    try {
      const prefs = await loadPreferences();
      setStartTime(prefs.startTime);
      // When loading, calculate end time from start time (9 hours later) if not already set
      const [hours, minutes] = prefs.startTime.split(':').map(Number);
      const startTotalMinutes = hours * 60 + minutes;
      const endTotalMinutes = startTotalMinutes + (9 * 60);
      let endHours = Math.floor(endTotalMinutes / 60);
      const endMins = endTotalMinutes % 60;
      if (endHours >= 24) {
        endHours = endHours % 24;
      }
      const calculatedEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
      setEndTime(calculatedEndTime);
      setTimeBlockOrder(prefs.timeBlockOrder);
      setUse12HourClock(prefs.use12HourClock ?? false);
      setColorScheme(prefs.colorScheme ?? 'earth-tone');
      setDarkMode(prefs.darkMode ?? false);
      setShowZenQuotes(prefs.showZenQuotes ?? true);
      setEnableEmailTemplates(prefs.enableEmailTemplates ?? true);
      setEmailClient(prefs.emailClient ?? 'default');
      setMapAppPreference(prefs.mapAppPreference ?? 'apple-maps');
      setTimezoneMode(prefs.timezoneMode ?? 'device');
      setTimezone(prefs.timezone ?? '');
      setCalendarSyncProvider(prefs.calendarSyncProvider ?? 'none');
      setGoogleCalendarId(prefs.googleCalendarId);
      setFollowUpDaysAfterApplication(String(prefs.followUpDaysAfterApplication ?? 7));
      setFollowUpDaysAfterInterview(String(prefs.followUpDaysAfterInterview ?? 2));
      setFollowUpDaysBetweenFollowUps(String(prefs.followUpDaysBetweenFollowUps ?? 2));
      setThankYouNoteDaysAfterInterview(String(prefs.thankYouNoteDaysAfterInterview ?? 1));
      setKanbanCardsPerColumn(String(prefs.kanbanCardsPerColumn ?? 5));
      setHomeFollowUpRemindersCount(String(prefs.homeFollowUpRemindersCount ?? 2));
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoize the generated blocks preview so it updates when startTime, endTime, or timeBlockOrder changes
  const generatedBlocksPreview = useMemo((): GeneratedTimeBlock[] => {
    try {
      // Try to parse times even if format is incomplete
      const startParts = startTime.split(':');
      const endParts = endTime.split(':');
      
      if (startParts.length !== 2 || endParts.length !== 2) {
        return [];
      }

      const startH = parseInt(startParts[0]) || 0;
      const startM = parseInt(startParts[1]) || 0;
      const endH = parseInt(endParts[0]) || 0;
      const endM = parseInt(endParts[1]) || 0;
      
      // Validate ranges
      if (startH < 0 || startH >= 24 || startM < 0 || startM >= 60 ||
          endH < 0 || endH >= 24 || endM < 0 || endM >= 60) {
        return [];
      }

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes >= endMinutes) {
        return [];
      }

      const tempPreferences: UserPreferences = {
        startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
        timeBlockOrder,
        hasCompletedSetup: false,
        use12HourClock: false, // Preview always uses 24-hour format
        colorScheme: 'earth-tone', // Preview uses default colors
        darkMode: false,
        mapAppPreference: 'apple-maps', // Preview uses default
        timezoneMode: 'device',
        timezone: '',
        calendarSyncProvider: 'none',
        followUpDaysAfterApplication: 7,
        followUpDaysAfterInterview: 2,
        followUpDaysBetweenFollowUps: 2,
        thankYouNoteDaysAfterInterview: 1,
        kanbanCardsPerColumn: 5,
        homeFollowUpRemindersCount: 2,
        showZenQuotes: true,
        enableEmailTemplates: true,
        emailClient: 'default',
        aiToneRewriting: 'none',
      };

      return generateTimeBlocks(tempPreferences);
    } catch {
      return [];
    }
  }, [startTime, endTime, timeBlockOrder]);

  const handleSave = async () => {
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      Alert.alert('Invalid Time', 'Please enter start time in HH:MM format (24-hour).');
      return;
    }

    // Ensure end time is 9 hours after start time
    const [saveStartHours, saveStartMinutes] = startTime.split(':').map(Number);
    const saveStartTotalMinutes = saveStartHours * 60 + saveStartMinutes;
    const saveEndTotalMinutes = saveStartTotalMinutes + (9 * 60);
    let finalEndHours = Math.floor(saveEndTotalMinutes / 60);
    const finalEndMins = saveEndTotalMinutes % 60;
    if (finalEndHours >= 24) {
      finalEndHours = finalEndHours % 24;
    }
    const finalEndTime = `${String(finalEndHours).padStart(2, '0')}:${String(finalEndMins).padStart(2, '0')}`;
    
    try {
      // Load existing preferences to preserve fields not edited in this screen
      const existingPrefs = await loadPreferences();
      const preferences: UserPreferences = {
        startTime,
        endTime: finalEndTime, // Always save as 9 hours after start
        timeBlockOrder,
        hasCompletedSetup: true,
        use12HourClock,
        colorScheme,
        darkMode,
        showZenQuotes,
        enableEmailTemplates,
        emailClient,
        mapAppPreference,
        timezoneMode,
        timezone: timezoneMode === 'custom' ? timezone.trim() : '',
        calendarSyncProvider,
        googleCalendarId: calendarSyncProvider === 'google' ? googleCalendarId : undefined,
        followUpDaysAfterApplication: parseInt(followUpDaysAfterApplication, 10) || 7,
        followUpDaysAfterInterview: parseInt(followUpDaysAfterInterview, 10) || 2,
        followUpDaysBetweenFollowUps: parseInt(followUpDaysBetweenFollowUps, 10) || 2,
        thankYouNoteDaysAfterInterview: parseInt(thankYouNoteDaysAfterInterview, 10) || 1,
        kanbanCardsPerColumn: parseInt(kanbanCardsPerColumn, 10) || 5,
        homeFollowUpRemindersCount: parseInt(homeFollowUpRemindersCount, 10) || 2,
        aiToneRewriting: existingPrefs.aiToneRewriting ?? 'none',
        openaiApiKey: existingPrefs.openaiApiKey,
        geminiApiKey: existingPrefs.geminiApiKey,
      };
      await savePreferences(preferences);
      await refreshPreferences(); // Refresh preferences context
      Alert.alert('Success', 'Preferences saved!', [
        { text: 'OK', onPress: onComplete }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences.');
    }
  };

  const handleExportData = async () => {
    if (isExporting || isImporting) {
      return;
    }
    setIsExporting(true);
    try {
      await exportAppData();
      Alert.alert('Export Ready', 'Share the export file to transfer your data to another device.');
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = () => {
    if (isExporting || isImporting) {
      return;
    }
    Alert.alert(
      'Import Data',
      'Importing will replace your current data on this device. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            setIsImporting(true);
            try {
              await importAppData();
              await refreshPreferences();
              Alert.alert('Import Complete', 'Data imported. Restart the app if anything looks out of date.');
            } catch (error) {
              console.error('Error importing data:', error);
              Alert.alert('Error', 'Failed to import data.');
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  const handleSelectTimeBlock = (index: number, blockId: string) => {
    const newOrder = [...timeBlockOrder];
    newOrder[index] = blockId;
    setTimeBlockOrder(newOrder);
    setShowTimeBlockDropdown(null);
  };

  const getTimeBlockById = (id: string): TimeBlock | undefined => {
    return TIME_BLOCKS.find(block => block.id === id);
  };

  const isBlockEditable = (blockId: string): boolean => {
    // Morning routine, Lunch, and Evening blocks are fixed and not editable
    return !['morning', 'lunch', 'evening'].includes(blockId);
  };

  const getAvailableTimeBlocks = (currentIndex: number): TimeBlock[] => {
    // Return all available time blocks
    return TIME_BLOCKS;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  const dynamicStyles = {
    container: { backgroundColor: currentColorScheme.colors.background },
    header: { backgroundColor: currentColorScheme.colors.surface, borderBottomColor: currentColorScheme.colors.border },
    title: { color: currentColorScheme.colors.text },
    subtitle: { color: currentColorScheme.colors.textSecondary },
    backButtonText: { color: currentColorScheme.colors.primary },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, dynamicStyles.backButtonText]}>← Cancel</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, dynamicStyles.title]}>🌿 Setup Planner</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Customize your daily schedule</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColorScheme.colors.text }]}>Day Times</Text>
          <Text style={[styles.sectionDescription, { color: currentColorScheme.colors.textSecondary }]}>
            Set your day start time. The end time is automatically set to 9 hours later. Time blocks will shift to match your schedule.
          </Text>
          <View style={styles.timeInputContainer}>
            <View style={styles.timeInput}>
              <Text style={[styles.timeLabel, { color: currentColorScheme.colors.text }]}>Start Time</Text>
              <TextInput
                style={[
                  styles.timeInputField,
                  {
                    backgroundColor: currentColorScheme.colors.surface,
                    borderColor: currentColorScheme.colors.border,
                    color: currentColorScheme.colors.text,
                  }
                ]}
                value={startTime}
                onChangeText={handleStartTimeChange}
                placeholder="08:00"
                placeholderTextColor={currentColorScheme.colors.textSecondary}
              />
              <Text style={[styles.timeHint, { color: currentColorScheme.colors.textSecondary }]}>24-hour format (HH:MM)</Text>
            </View>
            <View style={styles.timeInput}>
              <Text style={[styles.timeLabel, { color: currentColorScheme.colors.text }]}>End Time (auto)</Text>
              <TextInput
                style={[
                  styles.timeInputField,
                  styles.timeInputFieldReadOnly,
                  {
                    backgroundColor: currentColorScheme.colors.surface,
                    borderColor: currentColorScheme.colors.border,
                    color: currentColorScheme.colors.text,
                    opacity: 0.7,
                  }
                ]}
                value={endTime}
                editable={false}
                placeholder="22:00"
                placeholderTextColor={currentColorScheme.colors.textSecondary}
              />
              <Text style={[styles.timeHint, { color: currentColorScheme.colors.textSecondary }]}>Automatically set to 9 hours after start</Text>
            </View>
          </View>
          {generatedBlocksPreview.length > 0 && (
            <View style={[
              styles.previewContainer,
              {
                backgroundColor: currentColorScheme.colors.background,
                borderColor: currentColorScheme.colors.border,
              }
            ]}>
              <Text style={[styles.previewTitle, { color: currentColorScheme.colors.text }]}>
                Preview: {generatedBlocksPreview.length} time blocks
              </Text>
              {generatedBlocksPreview.slice(0, 3).map((block, idx) => (
                <Text key={idx} style={[styles.previewText, { color: currentColorScheme.colors.textSecondary }]}>
                  {use12HourClock ? formatTimeRange(block.time, true) : block.time} - {block.title}
                </Text>
              ))}
              {generatedBlocksPreview.length > 3 && (
                <Text style={[styles.previewText, { color: currentColorScheme.colors.textSecondary }]}>...</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColorScheme.colors.text }]}>
              Time Block Labels
            </Text>
            <Text style={[styles.sectionDescription, { color: currentColorScheme.colors.textSecondary }]}>
              Select time blocks for each position. Times will shift based on your start time.
            </Text>
            {timeBlockOrder.map((blockId, index) => {
              const block = getTimeBlockById(blockId);
              if (!block) return null;
              
              // Get the generated time for this block from preview by matching ID
              const generatedBlock = generatedBlocksPreview.find(gb => gb.id === blockId);
              const displayTime = generatedBlock ? generatedBlock.time : block.time;
              const formattedTime = use12HourClock ? formatTimeRange(displayTime, true) : displayTime;
              const editable = isBlockEditable(blockId);

              return (
                <View key={`${blockId}-${index}`} style={[
                  styles.blockItem,
                  {
                    backgroundColor: currentColorScheme.colors.surface,
                    borderColor: currentColorScheme.colors.border,
                  }
                ]}>
                  <View style={styles.blockContent}>
                    <Text style={[styles.blockPositionLabel, { color: currentColorScheme.colors.textSecondary }]}>
                      Position {index + 1}
                    </Text>
                    <Text style={[styles.blockTitle, { color: currentColorScheme.colors.text }]}>
                      🌿 {block.title}
                    </Text>
                    {block.description && (
                      <Text style={[styles.blockDescription, { color: currentColorScheme.colors.textSecondary }]}>
                        {block.description}
                      </Text>
                    )}
                    <Text style={[styles.blockTime, { color: currentColorScheme.colors.primary }]}>
                      {formattedTime}
                    </Text>
                    {!editable && (
                      <Text style={[styles.blockFixedLabel, { color: currentColorScheme.colors.textSecondary }]}>
                        Fixed block
                      </Text>
                    )}
                  </View>
                  {editable && (
                    <TouchableOpacity
                      style={[
                        styles.selectBlockButton,
                        { backgroundColor: currentColorScheme.colors.primary, borderColor: currentColorScheme.colors.primary }
                      ]}
                      onPress={() => setShowTimeBlockDropdown(index)}
                    >
                      <Text style={styles.selectBlockButtonText}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Google Calendar Selection Modal */}
          <Modal
            visible={showGoogleCalendarPicker}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowGoogleCalendarPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: currentColorScheme.colors.surface, borderColor: currentColorScheme.colors.border }]}>
                <View style={[styles.modalHeader, { borderBottomColor: currentColorScheme.colors.border }]}>
                  <Text style={[styles.modalTitle, { color: currentColorScheme.colors.text }]}>
                    Select Google Calendar
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowGoogleCalendarPicker(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={[styles.modalCloseButtonText, { color: currentColorScheme.colors.text }]}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScrollView}>
                  {availableGoogleCalendars.map((calendar) => {
                    const isSelected = googleCalendarId === calendar.id;
                    return (
                      <TouchableOpacity
                        key={calendar.id}
                        style={[
                          styles.timeBlockOption,
                          {
                            backgroundColor: isSelected ? currentColorScheme.colors.surface : currentColorScheme.colors.background,
                            borderColor: isSelected ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                          },
                          isSelected && { borderWidth: 2 }
                        ]}
                        onPress={() => {
                          // Ensure the calendar ID is valid before setting it
                          if (calendar.id) {
                            setGoogleCalendarId(calendar.id);
                          }
                          setShowGoogleCalendarPicker(false);
                        }}
                      >
                        <Text style={[styles.timeBlockOptionTitle, { color: currentColorScheme.colors.text }]}>
                          {calendar.title}
                        </Text>
                        {calendar.source && (
                          <Text style={[styles.timeBlockOptionDescription, { color: currentColorScheme.colors.textSecondary }]}>
                            {calendar.source.name}
                          </Text>
                        )}
                        {isSelected && (
                          <Text style={[styles.timeBlockOptionSelected, { color: currentColorScheme.colors.primary }]}>
                            ✓ Selected
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Time Block Selection Dropdown Modal */}
          <Modal
            visible={showTimeBlockDropdown !== null}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowTimeBlockDropdown(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: currentColorScheme.colors.surface, borderColor: currentColorScheme.colors.border }]}>
                <View style={[styles.modalHeader, { borderBottomColor: currentColorScheme.colors.border }]}>
                  <Text style={[styles.modalTitle, { color: currentColorScheme.colors.text }]}>
                    Select Time Block
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTimeBlockDropdown(null)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={[styles.modalCloseButtonText, { color: currentColorScheme.colors.text }]}>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScrollView}>
                  {showTimeBlockDropdown !== null && getAvailableTimeBlocks(showTimeBlockDropdown)
                    .filter(block => isBlockEditable(block.id)) // Only show editable blocks in dropdown
                    .map((block) => {
                      const isSelected = timeBlockOrder[showTimeBlockDropdown] === block.id;
                      return (
                        <TouchableOpacity
                          key={block.id}
                          style={[
                            styles.timeBlockOption,
                            {
                              backgroundColor: isSelected ? currentColorScheme.colors.surface : currentColorScheme.colors.background,
                              borderColor: isSelected ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                            },
                            isSelected && { borderWidth: 2 }
                          ]}
                          onPress={() => handleSelectTimeBlock(showTimeBlockDropdown, block.id)}
                        >
                          <Text style={[styles.timeBlockOptionTitle, { color: currentColorScheme.colors.text }]}>
                            {block.title}
                          </Text>
                          {block.description && (
                            <Text style={[styles.timeBlockOptionDescription, { color: currentColorScheme.colors.textSecondary }]}>
                              {block.description}
                            </Text>
                          )}
                          {isSelected && (
                            <Text style={[styles.timeBlockOptionSelected, { color: currentColorScheme.colors.primary }]}>
                              ✓ Selected
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
            </View>
          </Modal>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColorScheme.colors.text }]}>Display Settings</Text>
          
          <View style={[styles.settingRow, {
            backgroundColor: currentColorScheme.colors.surface,
            borderColor: currentColorScheme.colors.border,
          }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text }]}>
                12-Hour Clock
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary }]}>
                Display times in 12-hour format (AM/PM)
              </Text>
            </View>
            <Switch
              value={use12HourClock}
              onValueChange={setUse12HourClock}
              trackColor={{ false: '#a0826d', true: currentColorScheme.colors.secondary }}
              thumbColor={use12HourClock ? currentColorScheme.colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingRow, {
            backgroundColor: currentColorScheme.colors.surface,
            borderColor: currentColorScheme.colors.border,
          }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text }]}>
                Daily Zen Quotes
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary }]}>
                Show daily inspirational quotes in the Daily Planner
              </Text>
            </View>
            <Switch
              value={showZenQuotes}
              onValueChange={setShowZenQuotes}
              trackColor={{ false: '#a0826d', true: currentColorScheme.colors.secondary }}
              thumbColor={showZenQuotes ? currentColorScheme.colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingRow, {
            backgroundColor: currentColorScheme.colors.surface,
            borderColor: currentColorScheme.colors.border,
          }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text }]}>
                Email Templates
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary }]}>
                Enable email template functionality for thank you notes and follow-ups
              </Text>
            </View>
            <Switch
              value={enableEmailTemplates}
              onValueChange={setEnableEmailTemplates}
              trackColor={{ false: '#a0826d', true: currentColorScheme.colors.secondary }}
              thumbColor={enableEmailTemplates ? currentColorScheme.colors.primary : '#f4f3f4'}
            />
          </View>

          {enableEmailTemplates && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text, marginBottom: 8 }]}>
                Email Client
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary, marginBottom: 8 }]}>
                Choose which email client to use when sending emails
              </Text>
              <View style={styles.mapAppContainer}>
                <TouchableOpacity
                  style={[
                    styles.mapAppOption,
                    {
                      backgroundColor: currentColorScheme.colors.surface,
                      borderColor: emailClient === 'default' ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                    },
                    emailClient === 'default' && { borderWidth: 2 }
                  ]}
                  onPress={() => setEmailClient('default')}
                >
                  <Text
                    style={[
                      styles.mapAppText,
                      { color: currentColorScheme.colors.text },
                      emailClient === 'default' && { fontWeight: 'bold', color: currentColorScheme.colors.primary }
                    ]}
                  >
                    📧 Default Email Client
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.mapAppContainer, { marginTop: 8 }]}>
                <TouchableOpacity
                  style={[
                    styles.mapAppOption,
                    {
                      backgroundColor: currentColorScheme.colors.surface,
                      borderColor: emailClient === 'gmail' ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                    },
                    emailClient === 'gmail' && { borderWidth: 2 }
                  ]}
                  onPress={() => setEmailClient('gmail')}
                >
                  <Text
                    style={[
                      styles.mapAppText,
                      { color: currentColorScheme.colors.text },
                      emailClient === 'gmail' && { fontWeight: 'bold', color: currentColorScheme.colors.primary }
                    ]}
                  >
                    📨 Gmail
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColorScheme.colors.text }]}>
            Time Zone
          </Text>
          <Text style={[styles.sectionDescription, { color: currentColorScheme.colors.textSecondary }]}>
            Use your device time zone or specify a custom one (for example, &quot;America/New_York&quot;).
          </Text>
          <View style={styles.mapAppContainer}>
            <TouchableOpacity
              style={[
                styles.mapAppOption,
                {
                  backgroundColor: currentColorScheme.colors.surface,
                  borderColor: timezoneMode === 'device' ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                },
                timezoneMode === 'device' && { borderWidth: 2 }
              ]}
              onPress={() => setTimezoneMode('device')}
            >
              <Text
                style={[
                  styles.mapAppText,
                  { color: currentColorScheme.colors.text },
                  timezoneMode === 'device' && { fontWeight: 'bold', color: currentColorScheme.colors.primary }
                ]}
              >
                📱 Use device time zone
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.mapAppContainer, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[
                styles.mapAppOption,
                {
                  backgroundColor: currentColorScheme.colors.surface,
                  borderColor: timezoneMode === 'custom' ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                },
                timezoneMode === 'custom' && { borderWidth: 2 }
              ]}
              onPress={() => setTimezoneMode('custom')}
            >
              <View style={{ width: '100%' }}>
                <Text
                  style={[
                    styles.mapAppText,
                    { color: currentColorScheme.colors.text },
                    timezoneMode === 'custom' && { fontWeight: 'bold', color: currentColorScheme.colors.primary }
                  ]}
                >
                  🌍 Specify time zone
                </Text>
                <TextInput
                  style={[styles.timeInputField, { marginTop: 8 }]}
                  value={timezone}
                  onChangeText={setTimezone}
                  placeholder="e.g. America/New_York"
                  placeholderTextColor="#a0826d"
                  editable={timezoneMode === 'custom'}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColorScheme.colors.text }]}>
            Map App Preference
          </Text>
          <Text style={[styles.sectionDescription, { color: currentColorScheme.colors.textSecondary }]}>
            Choose which map app to use when opening addresses
          </Text>
          <View style={styles.mapAppContainer}>
            <TouchableOpacity
              style={[
                styles.mapAppOption,
                {
                  backgroundColor: currentColorScheme.colors.surface,
                  borderColor: mapAppPreference === 'apple-maps' ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                },
                mapAppPreference === 'apple-maps' && { borderWidth: 2 }
              ]}
              onPress={() => setMapAppPreference('apple-maps')}
            >
              <Text style={[
                styles.mapAppText,
                { color: currentColorScheme.colors.text },
                mapAppPreference === 'apple-maps' && { fontWeight: 'bold', color: currentColorScheme.colors.primary }
              ]}>
                🗺️ Apple Maps
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mapAppOption,
                {
                  backgroundColor: currentColorScheme.colors.surface,
                  borderColor: mapAppPreference === 'google-maps' ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                },
                mapAppPreference === 'google-maps' && { borderWidth: 2 }
              ]}
              onPress={() => setMapAppPreference('google-maps')}
            >
              <Text style={[
                styles.mapAppText,
                { color: currentColorScheme.colors.text },
                mapAppPreference === 'google-maps' && { fontWeight: 'bold', color: currentColorScheme.colors.primary }
              ]}>
                🌐 Google Maps
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColorScheme.colors.text }]}>
            Calendar Sync
          </Text>
          <Text style={[styles.sectionDescription, { color: currentColorScheme.colors.textSecondary }]}>
            Choose which calendar to sync events with (this controls your preference; syncing can be enabled later).
          </Text>
          <View style={styles.mapAppContainer}>
            <TouchableOpacity
              style={[
                styles.mapAppOption,
                {
                  backgroundColor: currentColorScheme.colors.surface,
                  borderColor: calendarSyncProvider === 'none' ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                },
                calendarSyncProvider === 'none' && { borderWidth: 2 }
              ]}
              onPress={() => setCalendarSyncProvider('none')}
            >
              <Text
                style={[
                  styles.mapAppText,
                  { color: currentColorScheme.colors.text },
                  calendarSyncProvider === 'none' && { fontWeight: 'bold', color: currentColorScheme.colors.primary }
                ]}
              >
                🚫 No calendar sync
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.mapAppContainer, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[
                styles.mapAppOption,
                {
                  backgroundColor: currentColorScheme.colors.surface,
                  borderColor: calendarSyncProvider === 'apple' ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                },
                calendarSyncProvider === 'apple' && { borderWidth: 2 }
              ]}
              onPress={() => setCalendarSyncProvider('apple')}
            >
              <Text
                style={[
                  styles.mapAppText,
                  { color: currentColorScheme.colors.text },
                  calendarSyncProvider === 'apple' && { fontWeight: 'bold', color: currentColorScheme.colors.primary }
                ]}
              >
                🍎 Apple Calendar
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.mapAppContainer, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[
                styles.mapAppOption,
                {
                  backgroundColor: currentColorScheme.colors.surface,
                  borderColor: calendarSyncProvider === 'google' ? currentColorScheme.colors.primary : currentColorScheme.colors.border,
                },
                calendarSyncProvider === 'google' && { borderWidth: 2 }
              ]}
              onPress={() => setCalendarSyncProvider('google')}
            >
              <Text
                style={[
                  styles.mapAppText,
                  { color: currentColorScheme.colors.text },
                  calendarSyncProvider === 'google' && { fontWeight: 'bold', color: currentColorScheme.colors.primary }
                ]}
              >
                📆 Google Calendar
              </Text>
            </TouchableOpacity>
          </View>
          {calendarSyncProvider === 'google' && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text, marginBottom: 8 }]}>
                Select Calendar
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary, marginBottom: 8 }]}>
                Choose which calendar to sync events with. Google calendars will appear at the top if detected.
              </Text>
              {availableGoogleCalendars.length === 0 ? (
                <View>
                  <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary, marginBottom: 8 }]}>
                    No Google calendars found. Please ensure you have Google Calendar synced on your device.
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.syncButton,
                      {
                        backgroundColor: currentColorScheme.colors.primary,
                        borderColor: currentColorScheme.colors.primary,
                        padding: 12,
                        marginTop: 8,
                      }
                    ]}
                    onPress={loadGoogleCalendars}
                  >
                    <Text style={[styles.syncButtonText, { fontSize: 14 }]}>
                      🔄 Refresh Calendar List
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    {
                      backgroundColor: currentColorScheme.colors.surface,
                      borderColor: currentColorScheme.colors.border,
                    }
                  ]}
                  onPress={() => setShowGoogleCalendarPicker(true)}
                >
                  <Text style={[styles.pickerButtonText, { color: googleCalendarId ? currentColorScheme.colors.text : currentColorScheme.colors.textSecondary }]}>
                    {googleCalendarId 
                      ? availableGoogleCalendars.find(cal => cal.id === googleCalendarId)?.title || 'Select calendar...'
                      : 'Select calendar...'}
                  </Text>
                  <Text style={[styles.pickerButtonArrow, { color: currentColorScheme.colors.textSecondary }]}>▼</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {calendarSyncProvider !== 'none' && (
            <TouchableOpacity
              style={[
                styles.syncButton,
                {
                  backgroundColor: currentColorScheme.colors.primary,
                  borderColor: currentColorScheme.colors.primary,
                }
              ]}
              onPress={async () => {
                try {
                  const allEvents = await getAllEvents();
                  if (allEvents.length === 0) {
                    Alert.alert('Calendar Sync', 'No events found to sync.');
                    return;
                  }
                  await syncAllEventsToCalendar(allEvents);
                } catch (error) {
                  console.error('Error syncing events:', error);
                  Alert.alert('Error', 'Failed to sync events to calendar.');
                }
              }}
            >
              <Text style={styles.syncButtonText}>
                🔄 Sync All Existing Events to Calendar
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColorScheme.colors.text }]}>
            Follow-Up Reminders
          </Text>
          <Text style={[styles.sectionDescription, { color: currentColorScheme.colors.textSecondary }]}>
            Configure when follow-up reminders should be scheduled for job applications and interviews
          </Text>
          <View style={[styles.settingRow, {
            backgroundColor: currentColorScheme.colors.surface,
            borderColor: currentColorScheme.colors.border,
            marginTop: 12,
          }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text }]}>
                Days After Application
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary }]}>
                Days after submitting an application to remind you to follow up
              </Text>
            </View>
            <TextInput
              style={[
                styles.followUpInput,
                {
                  backgroundColor: currentColorScheme.colors.background,
                  borderColor: currentColorScheme.colors.border,
                  color: currentColorScheme.colors.text,
                }
              ]}
              value={followUpDaysAfterApplication}
              onChangeText={setFollowUpDaysAfterApplication}
              placeholder="7"
              placeholderTextColor={currentColorScheme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.settingRow, {
            backgroundColor: currentColorScheme.colors.surface,
            borderColor: currentColorScheme.colors.border,
            marginTop: 12,
          }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text }]}>
                Days After Interview
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary }]}>
                Days after an interview to remind you to follow up
              </Text>
            </View>
            <TextInput
              style={[
                styles.followUpInput,
                {
                  backgroundColor: currentColorScheme.colors.background,
                  borderColor: currentColorScheme.colors.border,
                  color: currentColorScheme.colors.text,
                }
              ]}
              value={followUpDaysAfterInterview}
              onChangeText={setFollowUpDaysAfterInterview}
              placeholder="2"
              placeholderTextColor={currentColorScheme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.settingRow, {
            backgroundColor: currentColorScheme.colors.surface,
            borderColor: currentColorScheme.colors.border,
            marginTop: 12,
          }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text }]}>
                Days Between Follow-Ups
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary }]}>
                Days between follow-up reminders when one is completed (default: 2)
              </Text>
            </View>
            <TextInput
              style={[
                styles.followUpInput,
                {
                  backgroundColor: currentColorScheme.colors.background,
                  borderColor: currentColorScheme.colors.border,
                  color: currentColorScheme.colors.text,
                }
              ]}
              value={followUpDaysBetweenFollowUps}
              onChangeText={setFollowUpDaysBetweenFollowUps}
              placeholder="2"
              placeholderTextColor={currentColorScheme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.settingRow, {
            backgroundColor: currentColorScheme.colors.surface,
            borderColor: currentColorScheme.colors.border,
            marginTop: 12,
          }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text }]}>
                Days After Interview (Thank You Note)
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary }]}>
                Days after an interview to remind you to send a thank you note
              </Text>
            </View>
            <TextInput
              style={[
                styles.followUpInput,
                {
                  backgroundColor: currentColorScheme.colors.background,
                  borderColor: currentColorScheme.colors.border,
                  color: currentColorScheme.colors.text,
                }
              ]}
              value={thankYouNoteDaysAfterInterview}
              onChangeText={setThankYouNoteDaysAfterInterview}
              placeholder="1"
              placeholderTextColor={currentColorScheme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.settingRow, {
            backgroundColor: currentColorScheme.colors.surface,
            borderColor: currentColorScheme.colors.border,
            marginTop: 12,
          }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text }]}>
                Kanban Cards Per Column
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary }]}>
                Number of application cards to show per column in kanban board (default: 5)
              </Text>
            </View>
            <TextInput
              style={[
                styles.followUpInput,
                {
                  backgroundColor: currentColorScheme.colors.background,
                  borderColor: currentColorScheme.colors.border,
                  color: currentColorScheme.colors.text,
                }
              ]}
              value={kanbanCardsPerColumn}
              onChangeText={setKanbanCardsPerColumn}
              placeholder="5"
              placeholderTextColor={currentColorScheme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.settingRow, {
            backgroundColor: currentColorScheme.colors.surface,
            borderColor: currentColorScheme.colors.border,
            marginTop: 12,
          }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text }]}>
                Home Screen Follow-Up Reminders
              </Text>
              <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary }]}>
                Number of follow-up reminders to show on the home screen by default (default: 2)
              </Text>
            </View>
            <TextInput
              style={[
                styles.followUpInput,
                {
                  backgroundColor: currentColorScheme.colors.background,
                  borderColor: currentColorScheme.colors.border,
                  color: currentColorScheme.colors.text,
                }
              ]}
              value={homeFollowUpRemindersCount}
              onChangeText={setHomeFollowUpRemindersCount}
              placeholder="2"
              placeholderTextColor={currentColorScheme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColorScheme.colors.text }]}>
            Color Scheme
          </Text>
          <Text style={[styles.sectionDescription, { color: currentColorScheme.colors.textSecondary }]}>
            Choose your preferred color palette
          </Text>
          {Object.values(COLOR_SCHEMES).map((scheme) => (
            <TouchableOpacity
              key={scheme.name}
              style={[
                styles.colorSchemeOption,
                {
                  backgroundColor: currentColorScheme.colors.surface,
                  borderColor: colorScheme === scheme.name ? scheme.colors.primary : currentColorScheme.colors.border,
                },
                colorScheme === scheme.name && { borderWidth: 2 }
              ]}
              onPress={() => setColorScheme(scheme.name)}
            >
              <View style={[styles.colorSchemePreview, { backgroundColor: scheme.colors.primary }]} />
              <View style={[styles.colorSchemePreview, { backgroundColor: scheme.colors.secondary }]} />
              <View style={[styles.colorSchemePreview, { backgroundColor: scheme.colors.accent }]} />
              <Text style={[
                styles.colorSchemeName,
                { color: currentColorScheme.colors.text },
                colorScheme === scheme.name && { color: scheme.colors.primary, fontWeight: 'bold' }
              ]}>
                {scheme.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {colorScheme === 'modern' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColorScheme.colors.text }]}>
              Dark Mode
            </Text>
            <Text style={[styles.sectionDescription, { color: currentColorScheme.colors.textSecondary }]}>
              Toggle dark mode for the Modern color scheme
            </Text>
            <View style={[styles.settingRow, {
              backgroundColor: currentColorScheme.colors.surface,
              borderColor: currentColorScheme.colors.border,
            }]}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: currentColorScheme.colors.text }]}>
                  Enable Dark Mode
                </Text>
                <Text style={[styles.settingDescription, { color: currentColorScheme.colors.textSecondary }]}>
                  Use dark color scheme
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#6B7280', true: currentColorScheme.colors.secondary }}
                thumbColor={darkMode ? currentColorScheme.colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColorScheme.colors.text }]}>
            Data Transfer
          </Text>
          <Text style={[styles.sectionDescription, { color: currentColorScheme.colors.textSecondary }]}>
            Export your data to a file and import it on another device.
          </Text>
          <TouchableOpacity
            style={[
              styles.syncButton,
              {
                backgroundColor: currentColorScheme.colors.primary,
                borderColor: currentColorScheme.colors.primary,
                opacity: isExporting || isImporting ? 0.6 : 1,
              },
            ]}
            onPress={handleExportData}
            disabled={isExporting || isImporting}
          >
            <Text style={styles.syncButtonText}>
              {isExporting ? 'Exporting...' : '📤 Export Data'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.syncButton,
              {
                backgroundColor: currentColorScheme.colors.secondary,
                borderColor: currentColorScheme.colors.secondary,
                opacity: isExporting || isImporting ? 0.6 : 1,
              },
            ]}
            onPress={handleImportData}
            disabled={isExporting || isImporting}
          >
            <Text style={styles.syncButtonText}>
              {isImporting ? 'Importing...' : '📥 Import Data'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.sectionDescription, { color: currentColorScheme.colors.textSecondary }]}>
            Import replaces local data on this device.
          </Text>
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: currentColorScheme.colors.primary }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8b7355',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b5b4f',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A3A2A',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b5b4f',
    marginBottom: 16,
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeInputField: {
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    borderWidth: 1,
    textAlign: 'center',
  },
  timeInputFieldReadOnly: {
    // backgroundColor and opacity now set dynamically in component
  },
  timeHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  previewContainer: {
    marginTop: 16,
    backgroundColor: '#f5f5dc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A3A2A',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 12,
    color: '#6b5b4f',
    marginBottom: 4,
  },
  blockItem: {
    flexDirection: 'row',
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C9A66B',
    alignItems: 'center',
  },
  blockContent: {
    flex: 1,
  },
  blockPositionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b5b4f',
    marginBottom: 4,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
    marginBottom: 4,
  },
  blockDescription: {
    fontSize: 14,
    color: '#6b5b4f',
    marginBottom: 4,
  },
  blockTime: {
    fontSize: 12,
    color: '#8C6A4A',
    fontWeight: '500',
  },
  blockFixedLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  selectBlockButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 12,
  },
  selectBlockButtonText: {
    color: '#f5f5dc',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  timeBlockOption: {
    padding: 16,
    borderBottomWidth: 1,
  },
  timeBlockOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeBlockOptionDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  timeBlockOptionSelected: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4A3A2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#f5f5dc',
    fontSize: 18,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C9A66B',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A2A',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b5b4f',
  },
  followUpInput: {
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    textAlign: 'center',
    width: 80,
    minWidth: 80,
  },
  colorSchemeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7D7C1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSchemeOptionSelected: {
    borderWidth: 2,
  },
  colorSchemePreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#a0826d',
  },
  colorSchemeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A3A2A',
  },
  mapAppContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  mapAppOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  mapAppText: {
    fontSize: 16,
  },
  syncButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
  },
  syncButtonText: {
    color: '#f5f5dc',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  pickerButtonText: {
    fontSize: 16,
    flex: 1,
  },
  pickerButtonArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
});

