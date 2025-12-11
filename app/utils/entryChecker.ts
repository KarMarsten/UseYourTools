import AsyncStorage from '@react-native-async-storage/async-storage';

export const hasEntriesForDate = async (date: Date): Promise<boolean> => {
  try {
    const dateKey = date.toISOString().split('T')[0];
    const stored = await AsyncStorage.getItem(`planner_${dateKey}`);
    if (!stored) return false;
    
    const entries = JSON.parse(stored);
    // Check if there are any non-empty entries
    return Object.values(entries).some((entry: unknown) => {
      const text = entry as string;
      return text && text.trim().length > 0;
    });
  } catch (error) {
    console.error('Error checking entries:', error);
    return false;
  }
};

