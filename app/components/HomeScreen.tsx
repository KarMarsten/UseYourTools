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
  AppState,
} from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { getAllEvents, Event, getOverdueThankYouNotesCount } from '../utils/events';
import { getAllFollowUpReminders, FollowUpReminder } from '../utils/followUpReminders';
import { getDateKey } from '../utils/timeFormatter';

interface HomeScreenProps {
  onNavigateToCalendar: () => void;
  onNavigateToDailyPlanner: (date?: Date) => void;
  onNavigateToApplications: (applicationId?: string) => void;
  onNavigateToOffers: () => void;
  onNavigateToReferences: () => void;
  onNavigateToReports: () => void;
  onNavigateToInterviewPrep: () => void;
  onNavigateToThankYouNotes: () => void;
  onNavigateToSettings: () => void;
  onNavigateToAbout: () => void;
  onNavigateToUniversalSearch?: () => void;
  onViewReport?: (html: string, title: string) => void;
}

export default function HomeScreen({
  onNavigateToCalendar,
  onNavigateToDailyPlanner,
  onNavigateToApplications,
  onNavigateToOffers,
  onNavigateToReferences,
  onNavigateToReports,
  onNavigateToInterviewPrep,
  onNavigateToThankYouNotes,
  onNavigateToSettings,
  onNavigateToAbout,
  onNavigateToUniversalSearch,
}: HomeScreenProps) {
  const { colorScheme, preferences } = usePreferences();
  const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
  const [upcomingItems, setUpcomingItems] = useState<Array<{ type: 'event' | 'followup'; data: Event | FollowUpReminder; dateTime: Date }>>([]);
  const [showAboutTooltip, setShowAboutTooltip] = useState(false);
  const [showSettingsTooltip, setShowSettingsTooltip] = useState(false);
  const [pendingThankYouCount, setPendingThankYouCount] = useState<number>(0);
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [showAllUpcomingItems, setShowAllUpcomingItems] = useState(false);
  const [showAllFollowUps, setShowAllFollowUps] = useState(false);
  const [followUpReminders, setFollowUpReminders] = useState<FollowUpReminder[]>([]);

  useEffect(() => {
    loadUpcomingItems();
    loadFollowUpReminders();
    loadPendingThankYouCount();
    loadOverdueCount();
    
    // Refresh every minute to update the banner
    const interval = setInterval(() => {
      loadUpcomingItems();
      loadFollowUpReminders();
      loadPendingThankYouCount();
      loadOverdueCount();
    }, 60000);
    
    // Refresh when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadUpcomingItems();
        loadFollowUpReminders();
        loadPendingThankYouCount();
        loadOverdueCount();
      }
    });
    
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const loadPendingThankYouCount = async () => {
    try {
      // Use overdue count to match what's shown in ThankYouNotesScreen
      const count = await getOverdueThankYouNotesCount();
      setPendingThankYouCount(count);
    } catch (error) {
      console.error('Error loading pending thank you notes count:', error);
    }
  };

  const loadOverdueCount = async () => {
    try {
      // Only count overdue thank you notes since clicking the banner navigates to ThankYouNotesScreen
      // which only shows thank you notes, not follow-up reminders
      const overdueThankYous = await getOverdueThankYouNotesCount();
      setOverdueCount(overdueThankYous);
    } catch (error) {
      console.error('Error loading overdue count:', error);
    }
  };

  const loadUpcomingItems = async () => {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const items: Array<{ type: 'event' | 'followup'; data: Event | FollowUpReminder; dateTime: Date }> = [];
      
      // Load events only (follow-ups are handled separately)
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
      
      // Sort by date/time (earliest first)
      items.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
      
      setUpcomingItems(items);
    } catch (error) {
      console.error('Error loading upcoming items:', error);
    }
  };

  const loadFollowUpReminders = async () => {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const allReminders = await getAllFollowUpReminders();
      const today = new Date();
      const todayKey = getDateKey(today);
      
      const reminders: FollowUpReminder[] = [];
      
      for (const reminder of allReminders) {
        // Skip completed reminders
        if (reminder.completed) {
          continue;
        }
        
        // Skip reminders that were completed today (check completedAt date)
        if (reminder.completedAt) {
          try {
            const completedDate = new Date(reminder.completedAt);
            const completedDateKey = getDateKey(completedDate);
            if (completedDateKey === todayKey) {
              continue; // Skip reminders completed today
            }
          } catch (error) {
            console.warn('Could not parse completedAt date:', reminder.completedAt, error);
          }
        }
        
        const reminderDateTime = new Date(reminder.dueDate);
        
        // Only include reminders in the next 24 hours that haven't passed
        if (reminderDateTime > now && reminderDateTime <= in24Hours) {
          reminders.push(reminder);
        }
      }
      
      // Sort by date/time (earliest first)
      reminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      
      setFollowUpReminders(reminders);
    } catch (error) {
      console.error('Error loading follow-up reminders:', error);
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
      // For follow-up reminders, navigate to the specific application
      const reminder = item.data as FollowUpReminder;
      onNavigateToApplications(reminder.applicationId);
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
    {
      id: 'offers',
      title: 'Job Offers',
      description: 'Compare and contrast job offers',
      icon: '🎁',
      onPress: onNavigateToOffers,
    },
    {
      id: 'references',
      title: 'References',
      description: 'Manage your professional references',
      icon: '📞',
      onPress: onNavigateToReferences,
    },
    {
      id: 'thankYouNotes',
      title: 'Thank You Notes',
      description: pendingThankYouCount > 0 ? `${pendingThankYouCount} pending` : 'Send thank you notes after interviews',
      icon: '💌',
      onPress: onNavigateToThankYouNotes,
      badge: pendingThankYouCount > 0 ? pendingThankYouCount : undefined,
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
          {onNavigateToUniversalSearch && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={onNavigateToUniversalSearch}
            >
              <Text style={[styles.settingsIcon, { color: colorScheme.colors.text }]}>🔍</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={onNavigateToAbout}
            onLongPress={() => {
              setShowAboutTooltip(true);
              setTimeout(() => setShowAboutTooltip(false), 2000);
            }}
          >
            <Text style={[styles.settingsIcon, { color: colorScheme.colors.text }]}>ℹ️</Text>
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
          </TouchableOpacity>
        </View>
      </View>
      {/* Overdue Notes Banner */}
      {overdueCount > 0 && (
        <TouchableOpacity
          style={[styles.overdueBanner, { backgroundColor: colorScheme.colors.border, borderBottomColor: colorScheme.colors.border, borderLeftColor: colorScheme.colors.border, borderLeftWidth: 4 }]}
          onPress={onNavigateToThankYouNotes}
        >
          <Text style={[styles.overdueBannerText, { color: colorScheme.colors.text }]}>
            ⚠️ {overdueCount} overdue note{overdueCount !== 1 ? 's' : ''} pending
          </Text>
        </TouchableOpacity>
      )}
      {/* Tooltips rendered at container level to ensure they appear above all content */}
      {(showAboutTooltip || showSettingsTooltip) && (
        <View style={styles.tooltipContainer} pointerEvents="none">
          {showAboutTooltip && (
            <View style={[styles.tooltip, styles.aboutTooltip, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
              <Text style={[styles.tooltipText, { color: colorScheme.colors.text }]} numberOfLines={1} ellipsizeMode="clip">About</Text>
            </View>
          )}
          {showSettingsTooltip && (
            <View style={[styles.tooltip, styles.settingsTooltip, { backgroundColor: colorScheme.colors.surface, borderColor: colorScheme.colors.border }]}>
              <Text style={[styles.tooltipText, { color: colorScheme.colors.text }]} numberOfLines={1} ellipsizeMode="clip">Settings</Text>
            </View>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Follow-Up Reminders Banner */}
        {followUpReminders.length > 0 && (() => {
          const defaultCount = preferences?.homeFollowUpRemindersCount ?? 2;
          const displayedReminders = showAllFollowUps ? followUpReminders : followUpReminders.slice(0, defaultCount);
          
          return (
            <View>
              <View style={[styles.upcomingBanner, { backgroundColor: colorScheme.colors.background }]}>
                <Text style={[styles.upcomingBannerTitle, { color: colorScheme.colors.text }]}>
                  📋 Follow-Up Reminders
                </Text>
                {displayedReminders.map((reminder) => {
                  const reminderDateTime = new Date(reminder.dueDate);
                  
                  return (
                    <TouchableOpacity
                      key={reminder.id}
                      style={[styles.upcomingItem, { backgroundColor: colorScheme.colors.surface }]}
                      onPress={() => onNavigateToApplications(reminder.applicationId)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.upcomingItemIcon, { color: colorScheme.colors.primary }]}>
                        {reminder.type === 'interview' ? '💼' : '📋'}
                      </Text>
                      <View style={styles.upcomingItemContent}>
                        <Text style={[styles.upcomingItemTitle, { color: colorScheme.colors.text }]} numberOfLines={1}>
                          {reminder.type === 'interview' 
                            ? `Interview Follow-Up: ${reminder.company}`
                            : `Application Follow-Up: ${reminder.company}`}
                        </Text>
                        <Text style={[styles.upcomingItemTime, { color: colorScheme.colors.textSecondary }]}>
                          {reminderDateTime.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: preferences?.use12HourClock ?? false
                          })}
                          {' • '}
                          {formatTimeUntil(reminderDateTime)}
                        </Text>
                      </View>
                      <Text style={[styles.upcomingItemArrow, { color: colorScheme.colors.primary }]}>→</Text>
                    </TouchableOpacity>
                  );
                })}
                {followUpReminders.length > defaultCount && (
                  <TouchableOpacity
                    onPress={() => setShowAllFollowUps(!showAllFollowUps)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.upcomingBannerMore, { color: colorScheme.colors.primary }]}>
                      {showAllFollowUps 
                        ? 'Show less' 
                        : `+${followUpReminders.length - defaultCount} more`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={[styles.bannerSeparator, { backgroundColor: colorScheme.colors.border }]} />
            </View>
          );
        })()}

        {/* Upcoming Events Banner */}
        {upcomingItems.length > 0 && (
          <View>
            <View style={[styles.upcomingBanner, { backgroundColor: colorScheme.colors.background }]}>
              <Text style={[styles.upcomingBannerTitle, { color: colorScheme.colors.text }]}>
                ⏰ Upcoming Events
              </Text>
            {(showAllUpcomingItems ? upcomingItems : upcomingItems.slice(0, 3)).map((item, index) => {
              const event = item.data as Event;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.upcomingItem, { backgroundColor: colorScheme.colors.surface }]}
                  onPress={() => handleUpcomingItemPress(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.upcomingItemIcon, { color: colorScheme.colors.primary }]}>
                    {event?.type === 'interview' ? '📞' : event?.type === 'appointment' ? '📍' : '⏰'}
                  </Text>
                  <View style={styles.upcomingItemContent}>
                    <Text style={[styles.upcomingItemTitle, { color: colorScheme.colors.text }]} numberOfLines={1}>
                      {event?.title || 'Event'}
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
              <TouchableOpacity
                onPress={() => setShowAllUpcomingItems(!showAllUpcomingItems)}
                activeOpacity={0.7}
              >
                <Text style={[styles.upcomingBannerMore, { color: colorScheme.colors.primary }]}>
                  {showAllUpcomingItems 
                    ? 'Show less' 
                    : `+${upcomingItems.length - 3} more`}
                </Text>
              </TouchableOpacity>
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
            <TouchableOpacity
              style={[styles.reportsButton, { backgroundColor: colorScheme.colors.surface }]}
              onPress={onNavigateToInterviewPrep}
              activeOpacity={0.7}
            >
              <Text style={styles.reportsIcon}>🎤</Text>
              <Text style={[styles.reportsName, { color: colorScheme.colors.text }]}>
                Interview Prep
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
                    <View style={styles.menuTitleRow}>
                      <Text style={[styles.menuTitle, { color: colorScheme.colors.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.badge && item.badge > 0 && (
                        <View style={[styles.badge, { backgroundColor: colorScheme.colors.primary }]}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
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
    overflow: 'visible',
  },
  tooltipContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  header: {
    padding: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'visible',
    zIndex: 100,
  },
  overdueBanner: {
    padding: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueBannerText: {
    fontSize: 15,
    fontWeight: '600',
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
  quoteContainer: {
    marginTop: 12,
    marginBottom: 8,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'visible',
  },
  settingsButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  settingsIcon: {
    fontSize: 24,
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    width: 100,
  },
  aboutTooltip: {
    top: 70,
    right: 60,
  },
  settingsTooltip: {
    top: 70,
    right: 8,
  },
  tooltipText: {
    fontSize: 14,
    fontWeight: '600',
    includeFontPadding: false,
    textAlign: 'center',
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
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'left',
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    paddingVertical: 4,
    fontWeight: '600',
  },
});

