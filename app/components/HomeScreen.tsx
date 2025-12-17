import React, { useState, useEffect } from 'react';
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
import { getAllEvents, Event } from '../utils/events';
import { getActiveFollowUpReminders, FollowUpReminder } from '../utils/followUpReminders';
import { getDateKey } from '../utils/timeFormatter';

interface HomeScreenProps {
  onNavigateToCalendar: () => void;
  onNavigateToDailyPlanner: (date?: Date) => void;
  onNavigateToApplications: () => void;
  onNavigateToReports: () => void;
  onNavigateToSettings: () => void;
  onNavigateToAbout: () => void;
  onViewReport?: (html: string, title: string) => void;
}

export default function HomeScreen({
  onNavigateToCalendar,
  onNavigateToDailyPlanner,
  onNavigateToApplications,
  onNavigateToReports,
  onNavigateToSettings,
  onNavigateToAbout,
}: HomeScreenProps) {
  const { colorScheme, preferences } = usePreferences();
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
  const [upcomingItems, setUpcomingItems] = useState<Array<{ type: 'event' | 'followup'; data: Event | FollowUpReminder; dateTime: Date }>>([]);
  const [showAboutTooltip, setShowAboutTooltip] = useState(false);
  const [showSettingsTooltip, setShowSettingsTooltip] = useState(false);

  useEffect(() => {
    loadUpcomingItems();
    // Refresh every minute to update the banner
    const interval = setInterval(loadUpcomingItems, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadUpcomingItems = async () => {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const items: Array<{ type: 'event' | 'followup'; data: Event | FollowUpReminder; dateTime: Date }> = [];
      
      // Load events
      const allEvents = await getAllEvents();
      for (const event of allEvents) {
        const [year, month, day] = event.dateKey.split('-').map(Number);
        const [hours, minutes] = event.startTime.split(':').map(Number);
        const eventDateTime = new Date(year, month - 1, day, hours, minutes);
        
        // Only include events in the next 24 hours that haven't passed
        if (eventDateTime > now && eventDateTime <= in24Hours) {
          items.push({ type: 'event', data: event, dateTime: eventDateTime });
        }
      }
      
      // Load follow-up reminders
      const activeReminders = await getActiveFollowUpReminders();
      for (const reminder of activeReminders) {
        const reminderDateTime = new Date(reminder.dueDate);
        
        // Only include reminders in the next 24 hours that haven't passed
        if (reminderDateTime > now && reminderDateTime <= in24Hours) {
          items.push({ type: 'followup', data: reminder, dateTime: reminderDateTime });
        }
      }
      
      // Sort by date/time (earliest first)
      items.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
      
      setUpcomingItems(items);
    } catch (error) {
      console.error('Error loading upcoming items:', error);
    }
  };

  const formatTimeUntil = (dateTime: Date): string => {
    const now = new Date();
    const diffMs = dateTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `in ${diffHours}h ${diffMinutes}m`;
    } else {
      return `in ${diffMinutes}m`;
    }
  };

  const handleUpcomingItemPress = (item: { type: 'event' | 'followup'; data: Event | FollowUpReminder }) => {
    if (item.type === 'event') {
      const event = item.data as Event;
      const [year, month, day] = event.dateKey.split('-').map(Number);
      const eventDate = new Date(year, month - 1, day);
      onNavigateToDailyPlanner(eventDate);
    } else {
      // For follow-up reminders, navigate to applications
      onNavigateToApplications();
    }
  };

  const menuItems = [
    {
      id: 'dailyPlanner',
      title: 'Daily Planner',
      description: 'Plan your day with time blocks and notes',
      icon: '📝',
      onPress: () => onNavigateToDailyPlanner(),
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
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={onNavigateToAbout}
            onLongPress={() => {
              setShowAboutTooltip(true);
              setTimeout(() => setShowAboutTooltip(false), 2000);
            }}
          >
            <Text style={[styles.settingsIcon, { color: colorScheme.colors.text }]}>ℹ️</Text>
            {showAboutTooltip && (
              <View style={[styles.tooltip, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
                <Text style={[styles.tooltipText, { color: colorScheme.colors.text }]}>About</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={onNavigateToSettings}
            onLongPress={() => {
              setShowSettingsTooltip(true);
              setTimeout(() => setShowSettingsTooltip(false), 2000);
            }}
          >
            <Text style={[styles.settingsIcon, { color: colorScheme.colors.text }]}>⚙️</Text>
            {showSettingsTooltip && (
              <View style={[styles.tooltip, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
                <Text style={[styles.tooltipText, { color: colorScheme.colors.text }]}>Settings</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Items Banner */}
        {upcomingItems.length > 0 && (
          <View>
            <View style={[styles.upcomingBanner, { backgroundColor: colorScheme.colors.background }]}>
              <Text style={[styles.upcomingBannerTitle, { color: colorScheme.colors.text }]}>
                ⏰ Upcoming in Next 24 Hours
              </Text>
            {upcomingItems.slice(0, 3).map((item, index) => {
              const isEvent = item.type === 'event';
              const event = isEvent ? item.data as Event : null;
              const reminder = !isEvent ? item.data as FollowUpReminder : null;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.upcomingItem, { backgroundColor: colorScheme.colors.surface }]}
                  onPress={() => handleUpcomingItemPress(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.upcomingItemIcon, { color: colorScheme.colors.primary }]}>
                    {isEvent 
                      ? (event?.type === 'interview' ? '📞' : event?.type === 'appointment' ? '📍' : '⏰')
                      : (reminder?.type === 'interview' ? '💼' : '📋')}
                  </Text>
                  <View style={styles.upcomingItemContent}>
                    <Text style={[styles.upcomingItemTitle, { color: colorScheme.colors.text }]} numberOfLines={1}>
                      {isEvent 
                        ? event?.title || 'Event'
                        : reminder 
                          ? (reminder.type === 'interview' 
                            ? `Interview Follow-Up: ${reminder.company}`
                            : `Application Follow-Up: ${reminder.company}`)
                          : 'Follow-Up'}
                    </Text>
                    <Text style={[styles.upcomingItemTime, { color: colorScheme.colors.textSecondary }]}>
                      {item.dateTime.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: preferences?.use12HourClock ?? false
                      })}
                      {' • '}
                      {formatTimeUntil(item.dateTime)}
                    </Text>
                  </View>
                  <Text style={[styles.upcomingItemArrow, { color: colorScheme.colors.primary }]}>→</Text>
                </TouchableOpacity>
              );
            })}
            {upcomingItems.length > 3 && (
              <Text style={[styles.upcomingBannerMore, { color: colorScheme.colors.textSecondary }]}>
                +{upcomingItems.length - 3} more
              </Text>
            )}
            </View>
            <View style={[styles.bannerSeparator, { backgroundColor: colorScheme.colors.border }]} />
          </View>
        )}

        <View style={styles.mainContent}>
          <View style={styles.jobSitesSection}>
            <Text style={[styles.sectionTitle, { color: colorScheme.colors.text }]}>
              Job Sites
            </Text>
            <View style={[styles.jobSitesList, { backgroundColor: colorScheme.colors.surface }]}>
              {jobSites.map((site, index) => (
                <TouchableOpacity
                  key={site.id}
                  style={styles.jobSiteItem}
                  onPress={() => handleJobSitePress(site.appUrl, site.webUrl)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jobSiteIcon}>{site.icon}</Text>
                  <Text style={[styles.jobSiteName, { color: colorScheme.colors.text }]} numberOfLines={1}>
                    {site.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.reportsButton, { backgroundColor: colorScheme.colors.surface }]}
              onPress={onNavigateToReports}
              activeOpacity={0.7}
            >
              <Text style={styles.reportsIcon}>📊</Text>
              <Text style={[styles.reportsName, { color: colorScheme.colors.text }]}>
                Reports
              </Text>
            </TouchableOpacity>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  settingsIcon: {
    fontSize: 24,
  },
  tooltip: {
    position: 'absolute',
    bottom: -35,
    left: '50%',
    marginLeft: -35,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  tooltipText: {
    fontSize: 14,
    fontWeight: '600',
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
    flexShrink: 1,
  },
  reportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  reportsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  reportsName: {
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
  upcomingBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 0,
  },
  bannerSeparator: {
    height: 1,
    marginBottom: 16,
    marginTop: 0,
  },
  upcomingBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  upcomingItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  upcomingItemContent: {
    flex: 1,
    minWidth: 0,
  },
  upcomingItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  upcomingItemTime: {
    fontSize: 12,
  },
  upcomingItemArrow: {
    fontSize: 18,
    marginLeft: 8,
  },
  upcomingBannerMore: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

