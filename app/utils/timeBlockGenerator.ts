import { TimeBlock } from './plannerData';
import { UserPreferences } from './preferences';
import { TIME_BLOCKS } from './plannerData';

export interface GeneratedTimeBlock extends TimeBlock {
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
}

/**
 * Generates 2-hour time blocks between start and end times
 */
export const generateTimeBlocks = (preferences: UserPreferences): GeneratedTimeBlock[] => {
  const [startHour, startMin] = preferences.startTime.split(':').map(Number);
  const [endHour, endMin] = preferences.endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const totalMinutes = endMinutes - startMinutes;
  
  // Calculate number of 2-hour blocks (120 minutes each)
  const blockCount = Math.floor(totalMinutes / 120);
  
  const blocks: GeneratedTimeBlock[] = [];
  
  // Get the ordered block definitions based on preferences
  const orderedBlockDefinitions = preferences.timeBlockOrder
    .map(id => TIME_BLOCKS.find(block => block.id === id))
    .filter((block): block is TimeBlock => block !== undefined);
  
  // Generate blocks
  for (let i = 0; i < blockCount; i++) {
    const blockStartMinutes = startMinutes + (i * 120);
    const blockEndMinutes = blockStartMinutes + 120;
    
    const startHour = Math.floor(blockStartMinutes / 60);
    const startMin = blockStartMinutes % 60;
    const endHour = Math.floor(blockEndMinutes / 60);
    const endMin = blockEndMinutes % 60;
    
    const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    
    // Use the corresponding block definition, or create a default one
    const blockDefinition = orderedBlockDefinitions[i] || {
      id: `block-${i}`,
      time: '', // Will be set below
      title: 'Time Block',
      description: '',
    };
    
    // Always use the generated time, never the original time from block definition
    const generatedTime = `${startTime}–${endTime}`;
    
    blocks.push({
      id: blockDefinition.id,
      title: blockDefinition.title,
      description: blockDefinition.description,
      time: generatedTime, // Always use generated time based on start/end times
      startTime,
      endTime,
    });
  }
  
  return blocks;
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

