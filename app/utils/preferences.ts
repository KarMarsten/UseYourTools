import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeBlock, TIME_BLOCKS } from './plannerData';
import { ColorSchemeName } from './colorSchemes';

export interface UserPreferences {
  startTime: string; // Format: "HH:MM" (24-hour)
  endTime: string; // Format: "HH:MM" (24-hour)
  timeBlockOrder: string[]; // Array of time block IDs in custom order
  hasCompletedSetup: boolean;
  use12HourClock: boolean; // Toggle between 12-hour and 24-hour clock
  colorScheme: ColorSchemeName; // Selected color scheme
  darkMode: boolean; // Dark mode toggle (only applies to modern color scheme)
  mapAppPreference: 'apple-maps' | 'google-maps'; // Preferred map app
  timezoneMode: 'device' | 'custom'; // Whether to use device timezone or a custom one
  timezone?: string; // IANA timezone name when timezoneMode is 'custom' (e.g., "America/New_York")
  calendarSyncProvider: 'none' | 'apple' | 'google'; // Which calendar to sync with, if any
  googleCalendarId?: string; // ID of the selected Google Calendar (only used when calendarSyncProvider is 'google')
  followUpDaysAfterApplication: number; // Number of days after application to schedule follow-up reminder (default: 7)
  followUpDaysAfterInterview: number; // Number of days after interview to schedule follow-up reminder (default: 2)
  followUpDaysBetweenFollowUps: number; // Number of days between follow-ups when one is completed (default: 2)
  thankYouNoteDaysAfterInterview: number; // Number of days after interview to show thank you note reminder (default: 1)
  kanbanCardsPerColumn: number; // Number of cards to show per column in kanban board (default: 5)
  showZenQuotes: boolean; // Show daily zen quotes in Daily Planner (default: true)
  enableEmailTemplates: boolean; // Enable email template functionality (default: true)
  emailClient: 'default' | 'gmail'; // Preferred email client (default: 'default')
  aiToneRewriting: 'none' | 'openai' | 'gemini'; // AI service for tone rewriting (default: 'none')
  openaiApiKey?: string; // OpenAI API key (stored securely)
  geminiApiKey?: string; // Google Gemini API key (stored securely)
}

const DEFAULT_PREFERENCES: UserPreferences = {
  startTime: '08:00',
  endTime: '22:00',
  timeBlockOrder: TIME_BLOCKS.map(block => block.id), // Default: all blocks in order
  hasCompletedSetup: false,
  use12HourClock: false, // Default to 24-hour clock
  colorScheme: 'earth-tone', // Default to Earth-Tone
  darkMode: false, // Default to light mode
  mapAppPreference: 'apple-maps', // Default to Apple Maps
  timezoneMode: 'device',
  timezone: '',
  calendarSyncProvider: 'none',
  googleCalendarId: undefined,
  followUpDaysAfterApplication: 7, // Default: 7 days after application
  followUpDaysAfterInterview: 2, // Default: 2 days after interview
  followUpDaysBetweenFollowUps: 2, // Default: 2 days between follow-ups
  thankYouNoteDaysAfterInterview: 1, // Default: 1 day after interview
  kanbanCardsPerColumn: 5, // Default: 5 cards per column
  showZenQuotes: true, // Default: show zen quotes
  enableEmailTemplates: true, // Default: enable email templates
  emailClient: 'default', // Default: use default email client
  aiToneRewriting: 'none', // Default: no AI rewriting (use hardcoded rules)
  openaiApiKey: undefined,
  geminiApiKey: undefined,
};

const PREFERENCES_KEY = 'planner_preferences';

export const savePreferences = async (preferences: UserPreferences): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
};

export const loadPreferences = async (): Promise<UserPreferences> => {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle missing fields
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

