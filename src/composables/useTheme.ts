import { ref, watch } from 'vue';
import { THEMES, DEFAULT_THEME_ID, getThemeById } from '../constants/themes';
import type { Theme } from '../constants/themes';

const THEME_STORAGE_KEY = 'bingonews_theme';

const currentThemeId = ref<string>(DEFAULT_THEME_ID);
const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
if (storedTheme && THEMES.some(t => t.id === storedTheme)) {
  currentThemeId.value = storedTheme;
}

interface ThemeStyles {
  cardBg: string;
  cardBgHover: string;
  cardBorder: string;
  itemBg: string;
  itemBgHover: string;
  shadowColor: string;
  appBg: string;
  appBgColor: string;
}

const themeStyles: Record<string, ThemeStyles> = {
  apple: {
    cardBg: 'rgba(255, 255, 255, 0.75)',
    cardBgHover: 'rgba(255, 255, 255, 0.85)',
    cardBorder: 'rgba(0, 0, 0, 0.06)',
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
    itemBg: 'rgba(255, 255, 255, 0.5)',
    itemBgHover: 'rgba(255, 255, 255, 0.7)',
    shadowColor: 'rgba(45, 74, 74, 0.06)',
    appBg: 'linear-gradient(160deg, #C5D8D5 0%, #DDE8E6 40%, #F5F8F7 100%)',
    appBgColor: '#F5F8F7',
  },
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const colors = theme.colors;
  const styles = themeStyles[theme.id] || themeStyles.apple;

  root.setAttribute('data-theme', theme.id);

  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-light', colors.accentLight);
  root.style.setProperty('--color-accent-hover', colors.accentHover);
  root.style.setProperty('--color-bg-primary', colors.bgPrimary);
  root.style.setProperty('--color-bg-secondary', colors.bgSecondary);
  root.style.setProperty('--color-bg-hover', colors.bgHover);
  root.style.setProperty('--color-bg-active', colors.bgActive);
  root.style.setProperty('--color-text-primary', colors.textPrimary);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
  root.style.setProperty('--color-text-tertiary', colors.textTertiary);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--glass-bg', colors.glassBg);
  root.style.setProperty('--glass-border', colors.glassBorder);

  root.style.setProperty('--card-bg', styles.cardBg);
  root.style.setProperty('--card-bg-hover', styles.cardBgHover);
  root.style.setProperty('--card-border', styles.cardBorder);
  root.style.setProperty('--item-bg', styles.itemBg);
  root.style.setProperty('--item-bg-hover', styles.itemBgHover);
  root.style.setProperty('--shadow-color', styles.shadowColor);
  root.style.setProperty('--app-bg', styles.appBg);
  root.style.setProperty('--app-bg-color', styles.appBgColor);
}

watch(currentThemeId, (newId) => {
  applyTheme(getThemeById(newId));
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
