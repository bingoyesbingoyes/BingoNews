import { ref, watch } from 'vue';
import { THEMES, DEFAULT_THEME_ID, getThemeById } from '../constants/themes';

interface ThemeColors {
  accent: string;
  accentLight: string;
  accentHover: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  bgActive: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  error: string;
  focusRing: string;
  glassBg: string;
  glassBorder: string;
}

interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

const THEME_STORAGE_KEY = 'bingonews_theme';

// Global reactive state
const currentThemeId = ref<string>(DEFAULT_THEME_ID);

// Load theme from localStorage on init
const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
if (storedTheme && THEMES.some(t => t.id === storedTheme)) {
  currentThemeId.value = storedTheme;
}

// Apply theme CSS variables to document
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const colors = theme.colors;

  // Set dark mode attribute for CSS selectors
  root.setAttribute('data-theme', theme.id);

  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-light', colors.accentLight);
  root.style.setProperty('--color-accent-hover', colors.accentHover);

  root.style.setProperty('--color-bg-primary', colors.bgPrimary);
  root.style.setProperty('--color-bg-secondary', colors.bgSecondary);
  root.style.setProperty('--color-bg-tertiary', colors.bgTertiary);
  root.style.setProperty('--color-bg-hover', colors.bgHover);
  root.style.setProperty('--color-bg-active', colors.bgActive);

  root.style.setProperty('--color-text-primary', colors.textPrimary);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
  root.style.setProperty('--color-text-tertiary', colors.textTertiary);

  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-focus-ring', colors.focusRing);

  root.style.setProperty('--glass-bg', colors.glassBg);
  root.style.setProperty('--glass-border', colors.glassBorder);

  // Theme-specific styles
  const themeStyles: Record<string, {
    cardBg: string;
    cardBgHover: string;
    cardBorder: string;
    sidebarBg: string;
    titlebarBg: string;
    itemBg: string;
    itemBgHover: string;
    shadowColor: string;
    appBg: string;
    appBgColor: string;
  }> = {
    apple: {
      cardBg: 'rgba(255, 255, 255, 0.75)',
      cardBgHover: 'rgba(255, 255, 255, 0.85)',
      cardBorder: 'rgba(0, 0, 0, 0.06)',
      sidebarBg: 'rgba(255, 255, 255, 0.6)',
      titlebarBg: 'rgba(255, 255, 255, 0.7)',
      itemBg: 'rgba(255, 255, 255, 0.5)',
      itemBgHover: 'rgba(255, 255, 255, 0.7)',
      shadowColor: 'rgba(0, 0, 0, 0.06)',
      appBg: 'linear-gradient(160deg, #E8EAF6 0%, #E3F2FD 50%, #F5F5F7 100%)',
      appBgColor: '#F5F5F7',
    },
    dark: {
      cardBg: 'rgba(255, 255, 255, 0.05)',
      cardBgHover: 'rgba(255, 255, 255, 0.08)',
      cardBorder: 'rgba(255, 255, 255, 0.06)',
      sidebarBg: 'rgba(0, 0, 0, 0.2)',
      titlebarBg: 'rgba(0, 0, 0, 0.15)',
      itemBg: 'rgba(255, 255, 255, 0.06)',
      itemBgHover: 'rgba(255, 255, 255, 0.1)',
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      appBg: 'linear-gradient(160deg, #1e1e2e 0%, #181825 40%, #11111b 100%)',
      appBgColor: '#1e1e2e',
    },
    rose: {
      cardBg: 'rgba(255, 255, 255, 0.7)',
      cardBgHover: 'rgba(255, 255, 255, 0.85)',
      cardBorder: 'rgba(232, 93, 117, 0.08)',
      sidebarBg: 'rgba(255, 255, 255, 0.55)',
      titlebarBg: 'rgba(255, 255, 255, 0.65)',
      itemBg: 'rgba(255, 255, 255, 0.5)',
      itemBgHover: 'rgba(255, 255, 255, 0.7)',
      shadowColor: 'rgba(0, 0, 0, 0.05)',
      appBg: 'linear-gradient(160deg, #FECDD3 0%, #FDF2F8 50%, #FFF1F2 100%)',
      appBgColor: '#FDF2F4',
    },
    teal: {
      cardBg: 'rgba(255, 255, 255, 0.7)',
      cardBgHover: 'rgba(255, 255, 255, 0.85)',
      cardBorder: 'rgba(91, 138, 138, 0.1)',
      sidebarBg: 'rgba(255, 255, 255, 0.55)',
      titlebarBg: 'rgba(255, 255, 255, 0.65)',
      itemBg: 'rgba(255, 255, 255, 0.5)',
      itemBgHover: 'rgba(255, 255, 255, 0.7)',
      shadowColor: 'rgba(45, 74, 74, 0.06)',
      appBg: 'linear-gradient(160deg, #C5D8D5 0%, #DDE8E6 40%, #F5F8F7 100%)',
      appBgColor: '#F5F8F7',
    },
  };

  const style = themeStyles[theme.id] || themeStyles.apple;

  root.style.setProperty('--card-bg', style.cardBg);
  root.style.setProperty('--card-bg-hover', style.cardBgHover);
  root.style.setProperty('--card-border', style.cardBorder);
  root.style.setProperty('--sidebar-bg', style.sidebarBg);
  root.style.setProperty('--titlebar-bg', style.titlebarBg);
  root.style.setProperty('--item-bg', style.itemBg);
  root.style.setProperty('--item-bg-hover', style.itemBgHover);
  root.style.setProperty('--shadow-color', style.shadowColor);
  root.style.setProperty('--app-bg', style.appBg);
  root.style.setProperty('--app-bg-color', style.appBgColor);
}

// Watch for theme changes and apply
watch(currentThemeId, (newId) => {
  const theme = getThemeById(newId);
  applyTheme(theme);
  localStorage.setItem(THEME_STORAGE_KEY, newId);
}, { immediate: true });

export function useTheme() {
  function setTheme(themeId: string) {
    if (THEMES.some(t => t.id === themeId)) {
      currentThemeId.value = themeId;
    }
  }

  return {
    currentThemeId,
    themes: THEMES,
    setTheme
  };
}
