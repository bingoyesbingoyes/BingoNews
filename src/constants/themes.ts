export interface Theme {
  id: string;
  name: string;
  colors: {
    accent: string;
    accentLight: string;
    accentHover: string;
    bgPrimary: string;
    bgSecondary: string;
    bgHover: string;
    bgActive: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    error: string;
    glassBg: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'apple',
    name: 'Apple',
    colors: {
      accent: '#007AFF',
      accentLight: 'rgba(0, 122, 255, 0.12)',
      accentHover: '#0066DD',
      bgPrimary: '#F5F5F7',
      bgSecondary: '#FFFFFF',
      bgHover: 'rgba(0, 0, 0, 0.04)',
      bgActive: 'rgba(0, 0, 0, 0.06)',
      textPrimary: '#1D1D1F',
      textSecondary: '#6E6E73',
      textTertiary: '#AEAEB2',
      border: 'rgba(0, 0, 0, 0.06)',
      error: '#FF3B30',
      glassBg: 'rgba(255, 255, 255, 0.7)',
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      accent: '#89B4FA',
      accentLight: 'rgba(137, 180, 250, 0.15)',
      accentHover: '#B4BEFE',
      bgPrimary: '#1e1e2e',
      bgSecondary: '#181825',
      bgHover: 'rgba(255, 255, 255, 0.06)',
      bgActive: 'rgba(255, 255, 255, 0.1)',
      textPrimary: '#CDD6F4',
      textSecondary: '#A6ADC8',
      textTertiary: '#6C7086',
      border: 'rgba(255, 255, 255, 0.06)',
      error: '#F38BA8',
      glassBg: 'rgba(17, 17, 27, 0.6)',
    }
  },
  {
    id: 'rose',
    name: 'Rose',
    colors: {
      accent: '#E85D75',
      accentLight: 'rgba(232, 93, 117, 0.12)',
      accentHover: '#F472B6',
      bgPrimary: '#FDF2F4',
      bgSecondary: '#FFFFFF',
      bgHover: 'rgba(232, 93, 117, 0.08)',
      bgActive: 'rgba(232, 93, 117, 0.12)',
      textPrimary: '#4A2C32',
      textSecondary: '#9D7A82',
      textTertiary: '#C4A5AB',
      border: 'rgba(232, 93, 117, 0.1)',
      error: '#E85D75',
      glassBg: 'rgba(255, 255, 255, 0.7)',
    }
  },
  {
    id: 'teal',
    name: 'Teal',
    colors: {
      accent: '#5B8A8A',
      accentLight: 'rgba(91, 138, 138, 0.15)',
      accentHover: '#6B9E9E',
      bgPrimary: '#F5F8F7',
      bgSecondary: '#FFFFFF',
      bgHover: 'rgba(91, 138, 138, 0.1)',
      bgActive: 'rgba(91, 138, 138, 0.15)',
      textPrimary: '#2D4A4A',
      textSecondary: '#5B8A8A',
      textTertiary: '#8FB0B0',
      border: 'rgba(91, 138, 138, 0.12)',
      error: '#E57373',
      glassBg: 'rgba(255, 255, 255, 0.75)',
    }
  }
];

export const DEFAULT_THEME_ID = 'apple';

export function getThemeById(id: string): Theme {
  return THEMES.find(t => t.id === id) || THEMES[0];
}
