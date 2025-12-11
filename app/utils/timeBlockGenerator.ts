import { TimeBlock } from './plannerData';
import { UserPreferences } from './preferences';
import { TIME_BLOCKS } from './plannerData';

export interface GeneratedTimeBlock extends TimeBlock {
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
}

/**
 * Parses a time string like "8:00–9:00" or "13:00–14:30" to get start and end in minutes
 */
const parseTimeRange = (timeStr: string): { startMinutes: number; endMinutes: number } | null => {
  // Handle "Evening" case
  if (timeStr.toLowerCase().includes('evening')) {
    return null;
  }

  const parts = timeStr.split('–');
  if (parts.length !== 2) {
    return null;
  }

  const parseTime = (time: string): number => {
    const parts = time.trim().split(':');
    const hours = parseInt(parts[0] || '0', 10) || 0;
    const minutes = parseInt(parts[1] || '0', 10) || 0;
    return hours * 60 + minutes;
  };

  const startMinutes = parseTime(parts[0]);
  const endMinutes = parseTime(parts[1]);

  return { startMinutes, endMinutes };
};

/**
 * Generates time blocks by shifting the original blocks based on the new start time
 * Preserves the original durations and relative timings
 */
export const generateTimeBlocks = (preferences: UserPreferences): GeneratedTimeBlock[] => {
  // Get the original first block to calculate the shift
  const originalFirstBlock = TIME_BLOCKS[0];
  const originalFirstBlockTime = parseTimeRange(originalFirstBlock.time);
  
  if (!originalFirstBlockTime) {
    // Fallback if we can't parse
    return [];
  }

  // Calculate the shift amount
  const [newStartHour, newStartMin] = preferences.startTime.split(':').map(Number);
  const newStartMinutes = newStartHour * 60 + newStartMin;
  const shiftMinutes = newStartMinutes - originalFirstBlockTime.startMinutes;

  const blocks: GeneratedTimeBlock[] = [];
  
  // Get the ordered block definitions based on preferences
  const orderedBlockDefinitions = preferences.timeBlockOrder
    .map(id => TIME_BLOCKS.find(block => block.id === id))
    .filter((block): block is TimeBlock => block !== undefined);

  // Generate blocks by shifting the original times
  for (const blockDefinition of orderedBlockDefinitions) {
    const originalTime = parseTimeRange(blockDefinition.time);
    
    if (originalTime) {
      // Shift the times
      const newStartMinutes = originalTime.startMinutes + shiftMinutes;
      const newEndMinutes = originalTime.endMinutes + shiftMinutes;
      
      // Handle wrap-around for times past 24:00
      const normalizeMinutes = (minutes: number): number => {
        if (minutes < 0) return minutes + (24 * 60);
        if (minutes >= 24 * 60) return minutes % (24 * 60);
        return minutes;
      };

      const normalizedStart = normalizeMinutes(newStartMinutes);
      const normalizedEnd = normalizeMinutes(newEndMinutes);
      
      const startHour = Math.floor(normalizedStart / 60);
      const startMin = normalizedStart % 60;
      const endHour = Math.floor(normalizedEnd / 60);
      const endMin = normalizedEnd % 60;
      
      const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      const generatedTime = `${startTime}–${endTime}`;
      
      blocks.push({
        id: blockDefinition.id,
        title: blockDefinition.title,
        description: blockDefinition.description,
        time: generatedTime,
        startTime,
        endTime,
      });
    } else {
      // Handle "Evening" or other non-time blocks
      // Place it after the last timed block or use a special time
      blocks.push({
        id: blockDefinition.id,
        title: blockDefinition.title,
        description: blockDefinition.description,
        time: blockDefinition.time, // Keep original "Evening"
        startTime: '', // No specific start time
        endTime: '', // No specific end time
      });
    }
  }

  // Check if we should stop before the end time
  const [endHour, endMin] = preferences.endTime.split(':').map(Number);
  const endMinutes = endHour * 60 + endMin;
  
  // Filter out blocks that extend past the end time
  return blocks.filter(block => {
    if (!block.endTime) return true; // Keep "Evening" blocks
    const [blockEndH, blockEndM] = block.endTime.split(':').map(Number);
    const blockEndMinutes = blockEndH * 60 + blockEndM;
    return blockEndMinutes <= endMinutes;
  });
};

/**
 * Formats time in 12-hour format for display
 */
export const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};
