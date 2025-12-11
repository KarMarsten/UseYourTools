export type ColorSchemeName = 'earth-tone' | 'cheerful-nature' | 'sunny-sky' | 'imagination';

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
      background: '#f5f5dc',
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
      background: '#E8F5E9',
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
      background: '#FFF8DC',
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
      background: '#F5E6F5',
      surface: '#E8D5E8',
      text: '#4A2A5A',
      textSecondary: '#6B4A7B',
      border: '#C47BC4',
    },
  },
};

export const getColorScheme = (schemeName: ColorSchemeName): ColorScheme => {
  return COLOR_SCHEMES[schemeName] || COLOR_SCHEMES['earth-tone'];
};

