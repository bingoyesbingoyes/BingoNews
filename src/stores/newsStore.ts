import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
import type { Category, Source, AppConfig, OpenCountRecord } from '../types';
import { getColorByIndex } from '../constants/colors';
import { useConfigFile } from '../composables/useConfigFile';

const STORAGE_KEY = 'bingonews_data';
const OPEN_COUNTS_KEY = 'bingonews_open_counts';

export const useNewsStore = defineStore('news', () => {
  const categories = ref<Category[]>([]);
  const selectedSources = ref<Set<string>>(new Set());
  const focusedCategoryId = ref<string | null>(null);
  const showFrequentlyOpened = ref(true);

  // Open counts tracking
  const openCounts = ref<Record<string, OpenCountRecord>>({});

  // Config file composable
  const configFile = useConfigFile();
  const configSyncEnabled = ref(false);
  const isConfigInitialized = ref(false);

  // Computed - Frequently opened sources (sorted by count)
  const frequentlyOpenedSources = computed(() => {
    const allSources: (Source & { categoryId: string; categoryName: string; categoryColor?: string })[] = [];

    categories.value.forEach(cat => {
      cat.sources.forEach(source => {
        const stats = openCounts.value[source.id];
        if (stats && stats.count > 0) {
          allSources.push({
            ...source,
            categoryId: cat.id,
            categoryName: cat.name,
            categoryColor: cat.color,
            openCount: stats.count,
            lastOpened: stats.lastOpened,
          });
        }
      });
    });

    // Sort by count descending, then by lastOpened descending
    return allSources.sort((a, b) => {
      const countDiff = (b.openCount || 0) - (a.openCount || 0);
      if (countDiff !== 0) return countDiff;
      return (b.lastOpened || '').localeCompare(a.lastOpened || '');
    });
  });

  // Toggle frequently opened visibility
  function toggleFrequentlyOpened() {
    showFrequentlyOpened.value = !showFrequentlyOpened.value;
  }

  // Increment open count for a source
  function incrementOpenCount(sourceId: string) {
    const now = new Date().toISOString();
    const current = openCounts.value[sourceId] || { count: 0, lastOpened: '' };
    openCounts.value[sourceId] = {
      count: current.count + 1,
      lastOpened: now,
    };
    saveOpenCounts();
  }

  // Clear open count for a source (remove from frequently opened)
  function clearOpenCount(sourceId: string) {
    delete openCounts.value[sourceId];
    saveOpenCounts();
  }

  // Load open counts from storage
  function loadOpenCounts() {
    const stored = localStorage.getItem(OPEN_COUNTS_KEY);
    if (stored) {
      try {
        openCounts.value = JSON.parse(stored);
      } catch {
        openCounts.value = {};
      }
    }
  }

  // Save open counts to storage
  function saveOpenCounts() {
    localStorage.setItem(OPEN_COUNTS_KEY, JSON.stringify(openCounts.value));
    // Also trigger config file sync if enabled
    if (configSyncEnabled.value) {
      debouncedSyncToConfigFile();
    }
  }

  // Debounced config file sync
  let syncTimeout: ReturnType<typeof setTimeout> | null = null;
  function debouncedSyncToConfigFile() {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    syncTimeout = setTimeout(() => {
      syncToConfigFile();
    }, 1000);
  }

  // Config file sync methods
  async function initConfigSync() {
    if (isConfigInitialized.value) return;

    try {
      await configFile.initConfigPath();
      const config = await configFile.readConfig();

      // Load from config file
      if (config.categories && config.categories.length > 0) {
        // Ensure all categories have colors
        categories.value = config.categories.map((cat, index) => {
          if (!cat.color) {
            return {
              ...cat,
              color: getColorByIndex(index)
            };
          }
          return cat;
        });
      }
      if (config.openCounts) {
        openCounts.value = config.openCounts;
        // Also save to localStorage
        localStorage.setItem(OPEN_COUNTS_KEY, JSON.stringify(config.openCounts));
      }

      configSyncEnabled.value = true;
      isConfigInitialized.value = true;

      // Start watching for external changes
      configFile.startWatching((newConfig) => {
        console.log('Config file changed externally, reloading...');
        // Merge external changes
        if (newConfig.categories) {
          categories.value = newConfig.categories.map((cat, index) => {
            if (!cat.color) {
              return {
                ...cat,
                color: getColorByIndex(index)
              };
            }
            return cat;
          });
        }
        if (newConfig.openCounts) {
          openCounts.value = newConfig.openCounts;
        }
      });

      console.log('Config sync initialized, path:', configFile.configPath.value);
    } catch (e) {
      console.error('Config sync init failed:', e);
      // Fall back to localStorage
      loadData();
      loadOpenCounts();
    }
  }

  async function syncToConfigFile() {
    if (!configSyncEnabled.value) return;

    const config: AppConfig = {
      version: '1.0.0',
      categories: categories.value,
      openCounts: openCounts.value,
      settings: {
        theme: localStorage.getItem('bingonews_theme') || 'apple',
      },
    };

    await configFile.writeConfig(config);
  }

  // Load from localStorage
  function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Category[];
        // Ensure all categories have colors
        categories.value = parsed.map((cat, index) => {
          if (!cat.color) {
            return {
              ...cat,
              color: getColorByIndex(index)
            };
          }
          return cat;
        });
      } catch {
        categories.value = [];
      }
    } else {
      categories.value = [];
    }
  }

  // Save to localStorage
  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories.value));
  }

  // Watch for changes and auto-save
  watch(categories, () => {
    saveData();
    if (configSyncEnabled.value) {
      debouncedSyncToConfigFile();
    }
  }, { deep: true });

  // Category operations
  function addCategory(name: string, color?: string) {
    const id = `cat_${Date.now()}`;
    const categoryColor = color || getColorByIndex(categories.value.length);
    categories.value.push({
      id,
      name,
      sources: [],
      collapsed: false,
      color: categoryColor
    });
  }

  function updateCategoryColor(categoryId: string, color: string) {
    const category = categories.value.find(c => c.id === categoryId);
    if (category) {
      category.color = color;
    }
  }

  // Focus operations for keyboard navigation
  function setFocusedCategory(categoryId: string | null) {
    focusedCategoryId.value = categoryId;
  }

  function getNextCategoryId(): string | null {
    if (categories.value.length === 0) return null;
    if (!focusedCategoryId.value) {
      return categories.value[0].id;
    }
    const currentIndex = categories.value.findIndex(c => c.id === focusedCategoryId.value);
    if (currentIndex === -1 || currentIndex === categories.value.length - 1) {
      return categories.value[0].id;
    }
    return categories.value[currentIndex + 1].id;
  }

  function getPrevCategoryId(): string | null {
    if (categories.value.length === 0) return null;
    if (!focusedCategoryId.value) {
      return categories.value[categories.value.length - 1].id;
    }
    const currentIndex = categories.value.findIndex(c => c.id === focusedCategoryId.value);
    if (currentIndex === -1 || currentIndex === 0) {
      return categories.value[categories.value.length - 1].id;
    }
    return categories.value[currentIndex - 1].id;
  }

  function removeCategory(categoryId: string) {
    const index = categories.value.findIndex(c => c.id === categoryId);
    if (index !== -1) {
      // Remove selected sources from this category
      categories.value[index].sources.forEach(s => {
        selectedSources.value.delete(s.id);
      });
      categories.value.splice(index, 1);
    }
  }

  function updateCategoryName(categoryId: string, name: string) {
    const category = categories.value.find(c => c.id === categoryId);
    if (category) {
      category.name = name;
    }
  }

  function toggleCategoryCollapse(categoryId: string) {
    const category = categories.value.find(c => c.id === categoryId);
    if (category) {
      category.collapsed = !category.collapsed;
    }
  }

  // Source operations
  function addSource(categoryId: string, source: Omit<Source, 'id'>): string | undefined {
    const category = categories.value.find(c => c.id === categoryId);
    if (category) {
      const id = `src_${Date.now()}`;
      category.sources.unshift({ id, ...source });
      return id;
    }
    return undefined;
  }

  function removeSource(categoryId: string, sourceId: string) {
    const category = categories.value.find(c => c.id === categoryId);
    if (category) {
      const index = category.sources.findIndex(s => s.id === sourceId);
      if (index !== -1) {
        category.sources.splice(index, 1);
        selectedSources.value.delete(sourceId);
      }
    }
  }

  function updateSource(categoryId: string, sourceId: string, updates: Partial<Source>) {
    const category = categories.value.find(c => c.id === categoryId);
    if (category) {
      const source = category.sources.find(s => s.id === sourceId);
      if (source) {
        Object.assign(source, updates);
      }
    }
  }

  // Selection operations
  function toggleSourceSelection(sourceId: string) {
    if (selectedSources.value.has(sourceId)) {
      selectedSources.value.delete(sourceId);
    } else {
      selectedSources.value.add(sourceId);
    }
  }

  function selectAllInCategory(categoryId: string) {
    const category = categories.value.find(c => c.id === categoryId);
    if (category) {
      category.sources.forEach(s => {
        selectedSources.value.add(s.id);
      });
    }
  }

  function deselectAllInCategory(categoryId: string) {
    const category = categories.value.find(c => c.id === categoryId);
    if (category) {
      category.sources.forEach(s => {
        selectedSources.value.delete(s.id);
      });
    }
  }

  function clearSelection() {
    selectedSources.value.clear();
  }

  function getSelectedSourcesData(): Source[] {
    const selected: Source[] = [];
    categories.value.forEach(category => {
      category.sources.forEach(source => {
        if (selectedSources.value.has(source.id)) {
          selected.push(source);
        }
      });
    });
    return selected;
  }

  // Drag and drop operations
  function reorderCategories(newOrder: Category[]) {
    categories.value = newOrder;
  }

  // Initialize
  loadData();
  loadOpenCounts();

  return {
    categories,
    selectedSources,
    focusedCategoryId,
    showFrequentlyOpened,
    openCounts,
    frequentlyOpenedSources,
    toggleFrequentlyOpened,
    incrementOpenCount,
    clearOpenCount,
    initConfigSync,
    syncToConfigFile,
    configPath: configFile.configPath,
    addCategory,
    removeCategory,
    updateCategoryName,
    updateCategoryColor,
    toggleCategoryCollapse,
    setFocusedCategory,
    getNextCategoryId,
    getPrevCategoryId,
    addSource,
    removeSource,
    updateSource,
    toggleSourceSelection,
    selectAllInCategory,
    deselectAllInCategory,
    clearSelection,
    getSelectedSourcesData,
    reorderCategories
  };
});
