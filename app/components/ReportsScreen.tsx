import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { getAllEvents } from '../utils/events';
import { getAllApplications } from '../utils/applications';
import { exportWeeklySchedulePDF, exportUnemploymentReportPDF, exportJobApplicationsReportPDF, generateWeeklyScheduleHTML, generateUnemploymentReportHTML, generateJobApplicationsReportHTML } from '../utils/pdfExports';
import { getDateKey } from '../utils/timeFormatter';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReportsScreenProps {
  onBack: () => void;
  onViewReport: (html: string, title: string) => void;
}

export default function ReportsScreen({ onBack, onViewReport }: ReportsScreenProps) {
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date());
  const { colorScheme, preferences } = usePreferences();

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
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedWeekDate);
    newDate.setDate(selectedWeekDate.getDate() + 7);
    setSelectedWeekDate(newDate);
  };

  const handleCurrentWeek = () => {
    setSelectedWeekDate(new Date());
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
});

