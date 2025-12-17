import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';

interface HomeScreenProps {
  onNavigateToCalendar: () => void;
  onNavigateToDailyPlanner: () => void;
  onNavigateToApplications: () => void;
  onNavigateToResumes: () => void;
  onNavigateToReports: () => void;
  onNavigateToSettings: () => void;
}

export default function HomeScreen({
  onNavigateToCalendar,
  onNavigateToDailyPlanner,
  onNavigateToApplications,
  onNavigateToResumes,
  onNavigateToReports,
  onNavigateToSettings,
}: HomeScreenProps) {
  const { colorScheme } = usePreferences();
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

  const menuItems = [
    {
      id: 'dailyPlanner',
      title: 'Daily Planner',
      description: 'Plan your day with time blocks and notes',
      icon: '📝',
      onPress: onNavigateToDailyPlanner,
    },
    {
      id: 'calendar',
      title: 'Calendar',
      description: 'View appointments, interviews, and events',
      icon: '📅',
      onPress: onNavigateToCalendar,
    },
    {
      id: 'applications',
      title: 'Job Applications',
      description: 'Track your job applications and search history',
      icon: '💼',
      onPress: onNavigateToApplications,
    },
    {
      id: 'resumes',
      title: 'Resumes',
      description: 'Manage your resume files',
      icon: '📄',
      onPress: onNavigateToResumes,
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'View weekly schedules and unemployment reports',
      icon: '📊',
      onPress: onNavigateToReports,
    },
  ];

  const jobSites = [
    {
      id: 'indeed',
      name: 'Indeed',
      appUrl: 'indeed://search/jobs',
      webUrl: 'https://www.indeed.com',
      icon: '🔍',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      appUrl: 'linkedin://',
      webUrl: 'https://www.linkedin.com/jobs',
      icon: '💼',
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      appUrl: 'glassdoor://',
      webUrl: 'https://www.glassdoor.com/Job',
      icon: '🚪',
    },
    {
      id: 'monster',
      name: 'Monster',
      appUrl: 'monster://',
      webUrl: 'https://www.monster.com',
      icon: '👾',
    },
    {
      id: 'ziprecruiter',
      name: 'ZipRecruiter',
      appUrl: 'ziprecruiter://',
      webUrl: 'https://www.ziprecruiter.com',
      icon: '📎',
    },
    {
      id: 'dice',
      name: 'Dice',
      appUrl: 'dice://',
      webUrl: 'https://www.dice.com',
      icon: '🎲',
    },
  ];

  const handleJobSitePress = async (appUrl: string, webUrl: string) => {
    try {
      // Extract base scheme for checking
      const baseScheme = appUrl.split('://')[0];
      const baseSchemeUrl = `${baseScheme}://`;
      
      // Check if the app is available using canOpenURL
      // This requires the scheme to be in LSApplicationQueriesSchemes in Info.plist
      let canOpenApp = false;
      
      try {
        // Try checking with the full URL first
        canOpenApp = await Linking.canOpenURL(appUrl);
        console.log(`canOpenURL(${appUrl}):`, canOpenApp);
        
        // If that fails, try with just the base scheme
        if (!canOpenApp) {
          canOpenApp = await Linking.canOpenURL(baseSchemeUrl);
          console.log(`canOpenURL(${baseSchemeUrl}):`, canOpenApp);
        }
      } catch (checkError) {
        console.log('Error checking if app can be opened:', checkError);
        canOpenApp = false;
      }
      
      // If app is available, try to open it
      if (canOpenApp) {
        try {
          console.log('Opening app with:', appUrl);
          await Linking.openURL(appUrl);
          return; // Successfully opened app, exit early
        } catch (openError) {
          console.log('Failed to open app URL, trying base scheme:', openError);
          // Try base scheme as fallback
          try {
            await Linking.openURL(baseSchemeUrl);
            return;
          } catch (baseError) {
            console.log('Base scheme also failed, falling back to web:', baseError);
            // Fall through to web URL
          }
        }
      }
      
      // App is not available or failed to open, use web URL
      console.log('Opening web URL:', webUrl);
      await Linking.openURL(webUrl);
      
    } catch (error) {
      console.error('Error in handleJobSitePress:', error);
      // Last resort: try web URL
      try {
        await Linking.openURL(webUrl);
      } catch (webError) {
        console.error('Error opening web URL:', webError);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: colorScheme.colors.surface, borderBottomColor: colorScheme.colors.border, paddingTop: statusBarHeight + 12 }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colorScheme.colors.text }]}>
            UseYourTools
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
        <View style={styles.mainContent}>
          <View style={styles.jobSitesSection}>
            <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>
              Job Sites
            </Text>
            <View style={[styles.jobSitesList, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
              {jobSites.map((site, index) => (
                <TouchableOpacity
                  key={site.id}
                  style={[
                    styles.jobSiteItem,
                    {
                      borderBottomColor: colorScheme.colors.border,
                      borderBottomWidth: index < jobSites.length - 1 ? 1 : 0,
                    },
                  ]}
                  onPress={() => handleJobSitePress(site.appUrl, site.webUrl)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jobSiteIcon}>{site.icon}</Text>
                  <Text style={[styles.jobSiteName, { color: colorScheme.colors.text }]}>
                    {site.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>
              Tools
            </Text>
            <View style={styles.menuGrid}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuCard,
                    {
                      backgroundColor: colorScheme.colors.surface,
                    },
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuCardContent}>
                    <Text style={[styles.menuTitle, { color: colorScheme.colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.menuCardBottom}>
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                      <Text style={[styles.menuDescription, { color: colorScheme.colors.textSecondary }]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
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
    padding: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  mainContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  jobSitesSection: {
    width: 140,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  jobSitesList: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  jobSiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  jobSiteIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  jobSiteName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  menuSection: {
    flex: 1,
    minWidth: 0,
  },
  menuGrid: {
    gap: 12,
  },
  menuCard: {
    width: '100%',
    borderRadius: 12,
    overflow: 'visible',
  },
  menuCardContent: {
    padding: 16,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'left',
  },
  menuCardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  menuIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  menuDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
    flex: 1,
    flexShrink: 1,
  },
});

