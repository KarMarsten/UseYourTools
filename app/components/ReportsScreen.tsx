import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { getAllEvents } from '../utils/events';
import { getAllApplications } from '../utils/applications';
import { exportWeeklySchedulePDF, exportUnemploymentReportPDF, exportJobApplicationsReportPDF, generateWeeklyScheduleHTML, generateUnemploymentReportHTML, generateJobApplicationsReportHTML, generateActivityStatsReportHTML, exportActivityStatsReportPDF } from '../utils/pdfExports';
import { getDateKey } from '../utils/timeFormatter';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReportsScreenProps {
  onBack: () => void;
  onViewReport: (html: string, title: string) => void;
  onViewActivityStatsVisualization: (periodType: 'daily' | 'weekly' | 'monthly', startDate: Date) => void;
}

export default function ReportsScreen({ onBack, onViewReport, onViewActivityStatsVisualization }: ReportsScreenProps) {
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date());
  const [selectedStatsPeriod, setSelectedStatsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedStatsDate, setSelectedStatsDate] = useState(new Date());
  const { colorScheme, preferences } = usePreferences();

  // Week filter persistence key (same as ApplicationsScreen)
  const WEEK_FILTER_KEY = 'applications_week_filter';

  // Load persisted week filter on mount
  useEffect(() => {
    const loadPersistedWeekFilter = async () => {
      try {
        const stored = await AsyncStorage.getItem(WEEK_FILTER_KEY);
        if (stored) {
          const weekDate = new Date(stored);
          if (!isNaN(weekDate.getTime())) {
            // Only set if it's a valid date (not null from ApplicationsScreen)
            setSelectedWeekDate(weekDate);
          }
        }
        // If no stored value or null, ReportsScreen defaults to current week (already set in useState)
      } catch (error) {
        console.error('Error loading persisted week filter:', error);
      }
    };
    loadPersistedWeekFilter();
  }, []);

  // Save week filter when it changes
  useEffect(() => {
    const saveWeekFilter = async () => {
      try {
        await AsyncStorage.setItem(WEEK_FILTER_KEY, selectedWeekDate.toISOString());
      } catch (error) {
        console.error('Error saving week filter:', error);
      }
    };
    saveWeekFilter();
  }, [selectedWeekDate]);

  // Get Sunday of the week for the given date
  const getWeekStart = (date: Date): Date => {
    const weekStart = new Date(date);
    const day = weekStart.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = weekStart.getDate() - day; // Subtract days to get to Sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Get Saturday of the week
  const getWeekEnd = (date: Date): Date => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Add 6 days to get Saturday
    return weekEnd;
  };

  const formatWeekRange = (date: Date): string => {
    const weekStart = getWeekStart(date);
    const weekEnd = getWeekEnd(date);
    const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedWeekDate);
    newDate.setDate(selectedWeekDate.getDate() - 7);
    setSelectedWeekDate(newDate);
    // Week filter is automatically saved via useEffect
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedWeekDate);
    newDate.setDate(selectedWeekDate.getDate() + 7);
    setSelectedWeekDate(newDate);
    // Week filter is automatically saved via useEffect
  };

  const handleCurrentWeek = () => {
    setSelectedWeekDate(new Date());
    // Week filter is automatically saved via useEffect
  };

  const loadEntriesForWeek = async (weekStart: Date): Promise<Record<string, Record<string, string>>> => {
    const entries: Record<string, Record<string, string>> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateKey = getDateKey(date);
      try {
        const stored = await AsyncStorage.getItem(`planner_${dateKey}`);
        if (stored) {
          entries[dateKey] = JSON.parse(stored);
        }
      } catch (error) {
        console.error(`Error loading entries for ${dateKey}:`, error);
      }
    }
    return entries;
  };

  const handleExportWeeklySchedule = async () => {
    if (!preferences) {
      Alert.alert('Error', 'Preferences not loaded');
      return;
    }
    try {
      const weekStart = getWeekStart(selectedWeekDate);
      const entries = await loadEntriesForWeek(weekStart);
      const allEvents = await getAllEvents();
      
      await exportWeeklySchedulePDF(weekStart, preferences, entries, allEvents, colorScheme);
      // Success message is handled by the sharing dialog
    } catch (error) {
      console.error('Error exporting weekly schedule:', error);
      Alert.alert('Error', 'Failed to export weekly schedule');
    }
  };

  const handleExportUnemploymentReport = async () => {
    try {
      const weekStart = getWeekStart(selectedWeekDate);
      const allEvents = await getAllEvents();
      const allApplications = await getAllApplications();
      
      await exportUnemploymentReportPDF(weekStart, allEvents, allApplications, colorScheme);
      // Success message is handled by the sharing dialog
    } catch (error) {
      console.error('Error exporting unemployment report:', error);
      Alert.alert('Error', 'Failed to export unemployment report');
    }
  };

  const handleViewWeeklySchedule = async () => {
    if (!preferences) {
      Alert.alert('Error', 'Preferences not loaded');
      return;
    }
    try {
      const weekStart = getWeekStart(selectedWeekDate);
      const entries = await loadEntriesForWeek(weekStart);
      const allEvents = await getAllEvents();
      
      const html = generateWeeklyScheduleHTML(weekStart, preferences, entries, allEvents, colorScheme);
      onViewReport(html, `Weekly Schedule - ${formatWeekRange(selectedWeekDate)}`);
    } catch (error) {
      console.error('Error generating weekly schedule:', error);
      Alert.alert('Error', 'Failed to generate weekly schedule');
    }
  };

  const handleViewUnemploymentReport = async () => {
    try {
      const weekStart = getWeekStart(selectedWeekDate);
      const allEvents = await getAllEvents();
      const allApplications = await getAllApplications();
      
      const html = generateUnemploymentReportHTML(weekStart, allEvents, allApplications, colorScheme);
      onViewReport(html, `Unemployment Report - ${formatWeekRange(selectedWeekDate)}`);
    } catch (error) {
      console.error('Error generating unemployment report:', error);
      Alert.alert('Error', 'Failed to generate unemployment report');
    }
  };

  const handleExportJobApplicationsReport = async () => {
    try {
      const weekStart = getWeekStart(selectedWeekDate);
      const allApplications = await getAllApplications();
      
      await exportJobApplicationsReportPDF(weekStart, allApplications, colorScheme);
      // Success message is handled by the sharing dialog
    } catch (error) {
      console.error('Error exporting job applications report:', error);
      Alert.alert('Error', 'Failed to export job applications report');
    }
  };

  const handleViewJobApplicationsReport = async () => {
    try {
      const weekStart = getWeekStart(selectedWeekDate);
      const allApplications = await getAllApplications();
      
      const html = generateJobApplicationsReportHTML(weekStart, allApplications, colorScheme);
      onViewReport(html, `Job Applications Report - ${formatWeekRange(selectedWeekDate)}`);
    } catch (error) {
      console.error('Error generating job applications report:', error);
      Alert.alert('Error', 'Failed to generate job applications report');
    }
  };

  const handleViewActivityStatsReport = async () => {
    try {
      // Navigate to visualization screen instead of HTML view
      onViewActivityStatsVisualization(selectedStatsPeriod, selectedStatsDate);
    } catch (error) {
      console.error('Error opening activity statistics visualization:', error);
      Alert.alert('Error', 'Failed to open activity statistics visualization');
    }
  };

  const handleExportActivityStatsReport = async () => {
    try {
      const allEvents = await getAllEvents();
      const allApplications = await getAllApplications();
      
      await exportActivityStatsReportPDF(selectedStatsPeriod, selectedStatsDate, allEvents, allApplications, colorScheme);
      // Success message is handled by the sharing dialog
    } catch (error) {
      console.error('Error exporting activity statistics report:', error);
      Alert.alert('Error', 'Failed to export activity statistics report');
    }
  };

  const dynamicStyles = {
    container: { backgroundColor: colorScheme.colors.background },
    header: { backgroundColor: colorScheme.colors.surface },
    title: { color: colorScheme.colors.text },
    subtitle: { color: colorScheme.colors.textSecondary },
    button: { backgroundColor: colorScheme.colors.primary },
    buttonAccent: { backgroundColor: colorScheme.colors.accent },
    description: { color: colorScheme.colors.textSecondary },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colorScheme.colors.text }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, dynamicStyles.title]}>Reports</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, dynamicStyles.title]}>Report Options</Text>
          <Text style={[styles.sectionDescription, dynamicStyles.description]}>
            View or export PDF reports for your weekly schedule, unemployment filing, and job applications.
          </Text>
        </View>

        {/* Week Selector */}
        <View style={[styles.weekSelector, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
          <Text style={[styles.weekSelectorLabel, dynamicStyles.title]}>Select Week</Text>
          <View style={styles.weekNavigator}>
            <TouchableOpacity
              onPress={handlePreviousWeek}
              style={[styles.weekNavButton, { backgroundColor: colorScheme.colors.secondary }]}
            >
              <Text style={[styles.weekNavButtonText, { color: colorScheme.colors.text }]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.weekRangeContainer}>
              <Text style={[styles.weekRangeText, { color: colorScheme.colors.text }]}>
                {formatWeekRange(selectedWeekDate)}
              </Text>
              <TouchableOpacity
                onPress={handleCurrentWeek}
                style={styles.currentWeekButton}
              >
                <Text style={[styles.currentWeekButtonText, { color: colorScheme.colors.primary }]}>
                  Current Week
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleNextWeek}
              style={[styles.weekNavButton, { backgroundColor: colorScheme.colors.secondary }]}
            >
              <Text style={[styles.weekNavButtonText, { color: colorScheme.colors.text }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          {/* Weekly Schedule Section */}
          <View style={styles.reportSection}>
            <Text style={[styles.reportTitle, dynamicStyles.title]}>📄 Weekly Schedule</Text>
            <Text style={[styles.reportDescription, dynamicStyles.description]}>
              View or download a PDF of your weekly schedule with all planner entries and events
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colorScheme.colors.primary, flex: 1, marginRight: 8 }]}
                onPress={handleViewWeeklySchedule}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF8E7' }]}>
                  View
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colorScheme.colors.accent, flex: 1, marginLeft: 8 }]}
                onPress={handleExportWeeklySchedule}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF8E7' }]}>
                  Export PDF
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Unemployment Report Section */}
          <View style={styles.reportSection}>
            <Text style={[styles.reportTitle, dynamicStyles.title]}>📋 Unemployment Report</Text>
            <Text style={[styles.reportDescription, dynamicStyles.description]}>
              View or generate a PDF report with appointments and interviews for unemployment filing
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colorScheme.colors.primary, flex: 1, marginRight: 8 }]}
                onPress={handleViewUnemploymentReport}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF8E7' }]}>
                  View
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colorScheme.colors.accent, flex: 1, marginLeft: 8 }]}
                onPress={handleExportUnemploymentReport}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF8E7' }]}>
                  Export PDF
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Job Applications Report Section */}
          <View style={styles.reportSection}>
            <Text style={[styles.reportTitle, dynamicStyles.title]}>💼 Job Applications Report</Text>
            <Text style={[styles.reportDescription, dynamicStyles.description]}>
              View or generate a PDF report showing all job applications submitted during the selected week
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colorScheme.colors.primary, flex: 1, marginRight: 8 }]}
                onPress={handleViewJobApplicationsReport}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF8E7' }]}>
                  View
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colorScheme.colors.accent, flex: 1, marginLeft: 8 }]}
                onPress={handleExportJobApplicationsReport}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF8E7' }]}>
                  Export PDF
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Activity Statistics Report Section */}
          <View style={styles.reportSection}>
            <Text style={[styles.reportTitle, dynamicStyles.title]}>📊 Activity Statistics Report</Text>
            <Text style={[styles.reportDescription, dynamicStyles.description]}>
              View or generate a PDF report showing daily, weekly, or monthly statistics for applications, interviews, and events
            </Text>
            
            {/* Period Selector */}
            <View style={[styles.periodSelector, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
              <Text style={[styles.periodSelectorLabel, dynamicStyles.title]}>Period Type</Text>
              <View style={styles.periodButtons}>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: selectedStatsPeriod === 'daily' ? colorScheme.colors.primary : colorScheme.colors.secondary,
                    }
                  ]}
                  onPress={() => setSelectedStatsPeriod('daily')}
                >
                  <Text 
                    style={[
                      styles.periodButtonText,
                      { color: selectedStatsPeriod === 'daily' ? '#FFF8E7' : colorScheme.colors.text }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    Daily
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: selectedStatsPeriod === 'weekly' ? colorScheme.colors.primary : colorScheme.colors.secondary,
                    }
                  ]}
                  onPress={() => setSelectedStatsPeriod('weekly')}
                >
                  <Text 
                    style={[
                      styles.periodButtonText,
                      { color: selectedStatsPeriod === 'weekly' ? '#FFF8E7' : colorScheme.colors.text }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    Weekly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: selectedStatsPeriod === 'monthly' ? colorScheme.colors.primary : colorScheme.colors.secondary,
                    }
                  ]}
                  onPress={() => setSelectedStatsPeriod('monthly')}
                >
                  <Text 
                    style={[
                      styles.periodButtonText,
                      { color: selectedStatsPeriod === 'monthly' ? '#FFF8E7' : colorScheme.colors.text }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Selector */}
            <View style={[styles.dateSelector, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
              <Text style={[styles.dateSelectorLabel, dynamicStyles.title]}>
                {selectedStatsPeriod === 'daily' ? 'Select Date' : selectedStatsPeriod === 'weekly' ? 'Select Week' : 'Select Month'}
              </Text>
              <View style={styles.dateNavigator}>
                <TouchableOpacity
                  onPress={() => {
                    const newDate = new Date(selectedStatsDate);
                    if (selectedStatsPeriod === 'daily') {
                      newDate.setDate(selectedStatsDate.getDate() - 1);
                    } else if (selectedStatsPeriod === 'weekly') {
                      newDate.setDate(selectedStatsDate.getDate() - 7);
                    } else {
                      newDate.setMonth(selectedStatsDate.getMonth() - 1);
                    }
                    setSelectedStatsDate(newDate);
                  }}
                  style={[styles.dateNavButton, { backgroundColor: colorScheme.colors.secondary }]}
                >
                  <Text style={[styles.dateNavButtonText, { color: colorScheme.colors.text }]}>‹</Text>
                </TouchableOpacity>
                <View style={styles.dateRangeContainer}>
                  <Text style={[styles.dateRangeText, { color: colorScheme.colors.text }]}>
                    {selectedStatsPeriod === 'daily'
                      ? selectedStatsDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : selectedStatsPeriod === 'weekly'
                      ? formatWeekRange(selectedStatsDate)
                      : selectedStatsDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedStatsDate(new Date())}
                    style={styles.currentDateButton}
                  >
                    <Text style={[styles.currentDateButtonText, { color: colorScheme.colors.primary }]}>
                      Current {selectedStatsPeriod === 'daily' ? 'Day' : selectedStatsPeriod === 'weekly' ? 'Week' : 'Month'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const newDate = new Date(selectedStatsDate);
                    if (selectedStatsPeriod === 'daily') {
                      newDate.setDate(selectedStatsDate.getDate() + 1);
                    } else if (selectedStatsPeriod === 'weekly') {
                      newDate.setDate(selectedStatsDate.getDate() + 7);
                    } else {
                      newDate.setMonth(selectedStatsDate.getMonth() + 1);
                    }
                    setSelectedStatsDate(newDate);
                  }}
                  style={[styles.dateNavButton, { backgroundColor: colorScheme.colors.secondary }]}
                >
                  <Text style={[styles.dateNavButtonText, { color: colorScheme.colors.text }]}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colorScheme.colors.primary, flex: 1, marginRight: 8 }]}
                onPress={handleViewActivityStatsReport}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF8E7' }]}>
                  View
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colorScheme.colors.accent, flex: 1, marginLeft: 8 }]}
                onPress={handleExportActivityStatsReport}
              >
                <Text style={[styles.actionButtonText, { color: '#FFF8E7' }]}>
                  Export PDF
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  weekSelector: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  weekSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  weekRangeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekRangeText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentWeekButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  currentWeekButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonsContainer: {
    gap: 24,
  },
  reportSection: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FFF8E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  periodSelector: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  periodSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  dateSelector: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  dateSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateRangeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  currentDateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

