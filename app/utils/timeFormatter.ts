/**
 * Formats time in 12-hour format for display
 */
export const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

/**
 * Formats a time range (e.g., "08:00–10:00") based on clock preference
 */
export const formatTimeRange = (timeRange: string, use12Hour: boolean): string => {
  if (!timeRange || timeRange.toLowerCase().includes('evening')) {
    return timeRange;
  }

  const parts = timeRange.split('–');
  if (parts.length !== 2) {
    return timeRange;
  }

  if (use12Hour) {
    return `${formatTime12Hour(parts[0])}–${formatTime12Hour(parts[1])}`;
  }

  return timeRange; // Already in 24-hour format
};

