import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
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
  homeFollowUpRemindersCount: number; // Number of follow-up reminders to show on home screen (default: 2)
  showZenQuotes: boolean; // Show daily zen quotes in Daily Planner (default: true)
  enableEmailTemplates: boolean; // Enable email template functionality (default: true)
  emailClient: 'default' | 'gmail'; // Preferred email client (default: 'default')
  aiToneRewriting: 'none' | 'openai' | 'gemini'; // AI service for tone rewriting (default: 'none')
  openaiApiKey?: string; // OpenAI API key (stored in SecureStore, held in memory only)
  geminiApiKey?: string; // Google Gemini API key (stored in SecureStore, held in memory only)
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
  homeFollowUpRemindersCount: 2, // Default: 2 follow-up reminders on home screen
  showZenQuotes: true, // Default: show zen quotes
  enableEmailTemplates: true, // Default: enable email templates
  emailClient: 'default', // Default: use default email client
  aiToneRewriting: 'none', // Default: no AI rewriting (use hardcoded rules)
  openaiApiKey: undefined,
  geminiApiKey: undefined,
};

const PREFERENCES_KEY = 'planner_preferences';
const SECURE_KEY_OPENAI = 'openai_api_key';
const SECURE_KEY_GEMINI = 'gemini_api_key';

export const savePreferences = async (preferences: UserPreferences): Promise<void> => {
  try {
    // Persist API keys to SecureStore (iOS Keychain / Android Keystore)
    if (preferences.openaiApiKey !== undefined) {
      await SecureStore.setItemAsync(SECURE_KEY_OPENAI, preferences.openaiApiKey);
    }
    if (preferences.geminiApiKey !== undefined) {
      await SecureStore.setItemAsync(SECURE_KEY_GEMINI, preferences.geminiApiKey);
    }

    // Strip API keys from the AsyncStorage payload
    const { openaiApiKey, geminiApiKey, ...rest } = preferences;
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(rest));
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
};

export const loadPreferences = async (): Promise<UserPreferences> => {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    const base: UserPreferences = stored
      ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }
      : DEFAULT_PREFERENCES;

    // Load API keys from SecureStore and merge into the in-memory preferences object
    const [openaiApiKey, geminiApiKey] = await Promise.all([
      SecureStore.getItemAsync(SECURE_KEY_OPENAI),
      SecureStore.getItemAsync(SECURE_KEY_GEMINI),
    ]);

    return {
      ...base,
      openaiApiKey: openaiApiKey ?? undefined,
      geminiApiKey: geminiApiKey ?? undefined,
    };
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};
