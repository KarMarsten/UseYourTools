export interface TimeBlock {
  id: string;
  time: string;
  title: string;
  description?: string;
}

export interface DayTheme {
  day: string;
  theme: string;
}

export const DAY_THEMES: DayTheme[] = [
  { day: 'Monday', theme: 'Momentum & Planning' },
  { day: 'Tuesday', theme: 'Deep Focus & Skill Growth' },
  { day: 'Wednesday', theme: 'Networking & Connection' },
  { day: 'Thursday', theme: 'Projects & Mastery' },
  { day: 'Friday', theme: 'Review & Celebration' },
  { day: 'Saturday', theme: 'Joy & Life Admin' },
  { day: 'Sunday', theme: 'Rest & Renewal' },
];

export const TIME_BLOCKS: TimeBlock[] = [
  {
    id: 'morning',
    time: '8:00–9:00',
    title: 'Morning routine',
    description: 'Centering',
  },
  {
    id: 'high-focus',
    time: '9:00–11:00',
    title: 'High-focus work',
    description: 'Applications/learning/networking',
  },
  {
    id: 'research',
    time: '11:00–12:00',
    title: 'Research',
    description: 'Admin tasks',
  },
  {
    id: 'lunch',
    time: '12:00–13:00',
    title: 'Lunch + outdoor time',
  },
  {
    id: 'deep-work',
    time: '13:00–14:30',
    title: 'Deep work',
    description: 'Learning, projects, portfolio',
  },
  {
    id: 'break',
    time: '14:30–15:00',
    title: 'Break',
    description: 'Movement',
  },
  {
    id: 'networking',
    time: '15:00–16:00',
    title: 'Networking',
    description: 'Skill refinement',
  },
  {
    id: 'exercise',
    time: '16:00–17:00',
    title: 'Exercise',
    description: 'Walk • Recharge',
  },
  {
    id: 'evening',
    time: 'Evening',
    title: 'Creativity',
    description: 'Reading • Reflection',
  },
];

export const getDayTheme = (dayOfWeek: number): DayTheme => {
  return DAY_THEMES[dayOfWeek] || DAY_THEMES[0];
};

export const getDayName = (date: Date): string => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[date.getDay()];
};

export const getDayThemeForDate = (date: Date): DayTheme => {
  const dayOfWeek = date.getDay();
  // Convert Sunday (0) to index 6, Monday (1) to index 0, etc.
  const themeIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return DAY_THEMES[themeIndex];
};

