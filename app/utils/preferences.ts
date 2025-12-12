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
  mapAppPreference: 'apple-maps' | 'google-maps'; // Preferred map app
}

const DEFAULT_PREFERENCES: UserPreferences = {
  startTime: '08:00',
  endTime: '22:00',
  timeBlockOrder: TIME_BLOCKS.map(block => block.id), // Default: all blocks in order
  hasCompletedSetup: false,
  use12HourClock: false, // Default to 24-hour clock
  colorScheme: 'earth-tone', // Default to Earth-Tone
  mapAppPreference: 'apple-maps', // Default to Apple Maps
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

export const resetPreferences = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PREFERENCES_KEY);
  } catch (error) {
    console.error('Error resetting preferences:', error);
  }
};

