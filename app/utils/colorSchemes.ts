export type ColorSchemeName = 'earth-tone' | 'cheerful-nature' | 'sunny-sky' | 'imagination' | 'modern';

export interface ColorScheme {
  name: ColorSchemeName;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

export const COLOR_SCHEMES: Record<ColorSchemeName, ColorScheme> = {
  'earth-tone': {
    name: 'earth-tone',
    displayName: 'Earth-Tone',
    colors: {
      primary: '#8C6A4A',
      secondary: '#C9A66B',
      accent: '#A67C52',
      background: '#FFF8E7',
      surface: '#E7D7C1',
      text: '#4A3A2A',
      textSecondary: '#6b5b4f',
      border: '#C9A66B',
    },
  },
  'cheerful-nature': {
    name: 'cheerful-nature',
    displayName: 'Cheerful Nature',
    colors: {
      primary: '#5A8A6A',
      secondary: '#7BB88A',
      accent: '#6BA87A',
      background: '#FFF8E7',
      surface: '#C8E6C9',
      text: '#2E4A3A',
      textSecondary: '#4A6B5A',
      border: '#7BB88A',
    },
  },
  'sunny-sky': {
    name: 'sunny-sky',
    displayName: 'Sunny Sky',
    colors: {
      primary: '#D4A574',
      secondary: '#F5C842',
      accent: '#F4A460',
      background: '#FFF8E7',
      surface: '#FFE4B5',
      text: '#6B4A2A',
      textSecondary: '#8B6B4A',
      border: '#F5C842',
    },
  },
  'imagination': {
    name: 'imagination',
    displayName: 'Imagination Run Wild',
    colors: {
      primary: '#9B6FA8',
      secondary: '#C47BC4',
      accent: '#B084C4',
      background: '#FFF8E7',
      surface: '#E8D5E8',
      text: '#4A2A5A',
      textSecondary: '#6B4A7B',
      border: '#C47BC4',
    },
  },
  'modern': {
    name: 'modern',
    displayName: 'Modern',
    colors: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#EC4899',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
    },
  },
};

// Dark mode colors for modern scheme
const MODERN_DARK_COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#EC4899',
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
};

export const getColorScheme = (schemeName: ColorSchemeName, darkMode?: boolean): ColorScheme => {
  const baseScheme = COLOR_SCHEMES[schemeName] || COLOR_SCHEMES['earth-tone'];
  
  // Only modern scheme supports dark mode
  if (schemeName === 'modern' && darkMode) {
    return {
      ...baseScheme,
      colors: MODERN_DARK_COLORS,
    };
  }
  
  return baseScheme;
};

