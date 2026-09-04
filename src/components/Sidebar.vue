<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNewsStore } from '../stores/newsStore';
import { useTheme } from '../composables/useTheme';
import { Plus, Settings, X, TrendingUp } from 'lucide-vue-next';
import { SPECIAL_CATEGORY_IDS } from '../types';
import { DEFAULT_CATEGORY_COLOR } from '../constants/colors';

const store = useNewsStore();
const { currentThemeId, themes, setTheme } = useTheme();
const showSettings = ref(false);

const emit = defineEmits<{
  (e: 'scrollToCategory', categoryId: string): void;
  (e: 'addCategory'): void;
}>();

const categoriesWithCounts = computed(() => {
  return store.categories.map(cat => ({
    ...cat,
    color: cat.color || DEFAULT_CATEGORY_COLOR,
    count: cat.sources.length
  }));
});

const frequentlyOpenedCount = computed(() => store.frequentlyOpenedSources.length);
const showFrequentlyOpened = computed(() =>
  store.showFrequentlyOpened && frequentlyOpenedCount.value > 0
);

// Theme scroll
const themeScrollRef = ref<HTMLElement | null>(null);

function handleThemeWheel(e: WheelEvent) {
  if (themeScrollRef.value) {
    e.preventDefault();
    themeScrollRef.value.scrollLeft += e.deltaY;
  }
}

const shortcuts = [
  { keys: ['↑', '↓'], desc: 'Navigate categories' },
  { keys: ['Enter'], desc: 'Toggle collapse' },
  { keys: ['⌘', 'N'], desc: 'New category' },
  { keys: ['⌘', 'O'], desc: 'Open selected' },
  { keys: ['⌘', 'A'], desc: 'Select all' },
  { keys: ['⌘', 'B'], desc: 'Toggle sidebar' },
  { keys: ['⌘', 'K'], desc: 'Toggle quick access' },
  { keys: ['Delete'], desc: 'Delete category' },
  { keys: ['Esc'], desc: 'Clear selection' },
];

// Theme preview gradients for the selector
const themePreviewStyles: Record<string, string> = {
  apple: 'linear-gradient(135deg, #E8EAF6 0%, #E3F2FD 50%, #007AFF 100%)',
  dark: 'linear-gradient(135deg, #1e1e2e 0%, #181825 50%, #11111b 100%)',
  rose: 'linear-gradient(135deg, #FECDD3 0%, #FDF2F8 50%, #E85D75 100%)',
  teal: 'linear-gradient(135deg, #C5D8D5 0%, #DDE8E6 50%, #5B8A8A 100%)'
};
</script>

<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <!-- Quick Access Section -->
      <div v-if="showFrequentlyOpened" class="nav-section">
        <span class="nav-section-title">Quick Access</span>
        <ul class="nav-list">
          <li
            class="nav-item special-nav-item"
            :class="{ focused: store.focusedCategoryId === SPECIAL_CATEGORY_IDS.FREQUENTLY_OPENED }"
            @click="store.setFocusedCategory(SPECIAL_CATEGORY_IDS.FREQUENTLY_OPENED); emit('scrollToCategory', SPECIAL_CATEGORY_IDS.FREQUENTLY_OPENED)"
          >
            <TrendingUp :size="14" class="nav-icon-special" />
            <span class="nav-label">Frequently Opened</span>
            <span class="nav-count special-count">{{ frequentlyOpenedCount }}</span>
          </li>
        </ul>
      </div>

      <div class="nav-section">
        <span class="nav-section-title">Categories</span>
        <ul class="nav-list">
          <li
            v-for="category in categoriesWithCounts"
            :key="category.id"
            class="nav-item"
            :class="{ focused: store.focusedCategoryId === category.id }"
            @click="store.setFocusedCategory(category.id); emit('scrollToCategory', category.id)"
          >
            <span
              class="category-color-dot"
              :style="{ backgroundColor: category.color }"
            />
            <span class="nav-label">{{ category.name }}</span>
            <span class="nav-count">{{ category.count }}</span>
          </li>
        </ul>
        <button class="add-category-btn" @click="emit('addCategory')">
          <Plus :size="16" />
          <span>Add Category</span>
        </button>
      </div>
    </nav>

    <div class="sidebar-footer">
      <button class="settings-btn" @click="showSettings = !showSettings">
        <Settings :size="16" />
        <span>Settings</span>
      </button>
    </div>

    <!-- Settings Panel -->
    <Transition name="slide-up">
      <div v-if="showSettings" class="settings-panel">
        <div class="settings-header">
          <span class="settings-title">Settings</span>
          <button class="btn btn-icon" @click="showSettings = false">
            <X :size="16" />
          </button>
        </div>

        <!-- Theme Selector -->
        <div class="settings-section">
          <span class="section-label">Theme</span>
          <div
            ref="themeScrollRef"
            class="theme-selector"
            @wheel="handleThemeWheel"
          >
            <button
              v-for="theme in themes"
              :key="theme.id"
              class="theme-option"
              :class="{ active: currentThemeId === theme.id }"
              @click="setTheme(theme.id)"
            >
              <span
                class="theme-preview"
                :style="{ background: themePreviewStyles[theme.id] }"
              />
              <span class="theme-name">{{ theme.name }}</span>
            </button>
          </div>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="settings-section">
          <span class="section-label">Keyboard Shortcuts</span>
          <ul class="shortcuts-list">
            <li v-for="(shortcut, index) in shortcuts" :key="index" class="shortcut-item">
              <span class="shortcut-keys">
                <kbd v-for="(key, i) in shortcut.keys" :key="i">{{ key }}</kbd>
              </span>
              <span class="shortcut-desc">{{ shortcut.desc }}</span>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
}

.nav-section {
  margin-bottom: var(--space-lg);
}

.nav-section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--space-sm) var(--space-md);
  display: block;
}

.nav-list {
  list-style: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-text-primary);
}

.nav-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-accent);
}

.nav-item.focused {
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.category-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.nav-label {
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-count {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: var(--item-bg);
  padding: 2px 8px;
  border-radius: 10px;
}

.sidebar-footer {
  padding: var(--space-md);
}

.add-category-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.add-category-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.settings-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.settings-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

/* Settings Panel */
.settings-panel {
  position: absolute;
  bottom: 60px;
  left: var(--space-md);
  right: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  max-height: 70vh;
  overflow-y: auto;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.settings-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.settings-section {
  margin-bottom: var(--space-lg);
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-sm);
}

/* Theme Selector */
.theme-selector {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.theme-selector::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.theme-option {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  background: var(--color-bg-secondary);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-option:hover {
  background: var(--color-bg-hover);
}

.theme-option.active {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}

.theme-preview {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.theme-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.shortcuts-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) 0;
}

.shortcut-keys {
  display: flex;
  gap: 4px;
}

.shortcut-keys kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  background: var(--item-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-family: var(--font-family);
  color: var(--color-text-secondary);
  box-shadow: 0 1px 0 var(--color-border);
}

.shortcut-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

/* Slide up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--transition-normal);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Special nav item for Frequently Opened */
.special-nav-item {
  background: var(--color-accent-light);
  border: 1px solid var(--color-accent);
}

.special-nav-item:hover {
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
}

.special-nav-item.focused {
  background: color-mix(in srgb, var(--color-accent) 25%, transparent);
}

.nav-icon-special {
  color: var(--color-accent);
  flex-shrink: 0;
}

.special-count {
  background: var(--color-accent);
  color: white;
}
</style>
