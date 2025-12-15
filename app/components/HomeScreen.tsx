import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';

interface HomeScreenProps {
  onNavigateToCalendar: () => void;
  onNavigateToApplications: () => void;
  onNavigateToResumes: () => void;
  onNavigateToReports: () => void;
  onNavigateToSettings: () => void;
}

export default function HomeScreen({
  onNavigateToCalendar,
  onNavigateToApplications,
  onNavigateToResumes,
  onNavigateToReports,
  onNavigateToSettings,
}: HomeScreenProps) {
  const { colorScheme } = usePreferences();

  const menuItems = [
    {
      id: 'calendar',
      title: 'Calendar',
      description: 'View your schedule and daily planner',
      icon: '📅',
      onPress: onNavigateToCalendar,
      color: '#8C6A4A',
    },
    {
      id: 'applications',
      title: 'Job Applications',
      description: 'Track your job applications and search history',
      icon: '💼',
      onPress: onNavigateToApplications,
      color: '#8C6A4A',
    },
    {
      id: 'resumes',
      title: 'Resumes',
      description: 'Manage your resume files',
      icon: '📄',
      onPress: onNavigateToResumes,
      color: '#8C6A4A',
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'View weekly schedules and unemployment reports',
      icon: '📊',
      onPress: onNavigateToReports,
      color: '#8C6A4A',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colorScheme.colors.text }]}>
            🎯 UseYourTools
          </Text>
          <Text style={[styles.subtitle, { color: colorScheme.colors.textSecondary }]}>
            Tools for Job Hunters
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={onNavigateToSettings}
        >
          <Text style={[styles.settingsIcon, { color: colorScheme.colors.text }]}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: colorScheme.colors.text }]}>
            Welcome to your job hunting toolkit!{'\n'}
            Select a tool to get started.
          </Text>
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuCard,
                {
                  backgroundColor: colorScheme.colors.surface,
                  borderColor: colorScheme.colors.border,
                },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuCardContent}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuTitle, { color: colorScheme.colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.menuDescription, { color: colorScheme.colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8b7355',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b5b4f',
  },
  settingsButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
    color: '#8b7355',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#E7D7C1',
  },
  welcomeText: {
    fontSize: 16,
    color: '#4A3A2A',
    textAlign: 'center',
    lineHeight: 24,
  },
  menuGrid: {
    gap: 16,
  },
  menuCard: {
    backgroundColor: '#E7D7C1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C9A66B',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuCardContent: {
    padding: 20,
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4A3A2A',
    marginBottom: 8,
    textAlign: 'center',
  },
  menuDescription: {
    fontSize: 14,
    color: '#6b5b4f',
    textAlign: 'center',
    lineHeight: 20,
  },
});

