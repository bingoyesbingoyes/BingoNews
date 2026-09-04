import { onMounted, onUnmounted } from 'vue';
import { useNewsStore } from '../stores/newsStore';
import { openPath, openUrl } from '@tauri-apps/plugin-opener';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface KeyboardShortcutsOptions {
  onToggleSidebar?: () => void;
  onToggleFrequentlyOpened?: () => void;
  onAddCategory?: () => void;
  onDeleteCategory?: (categoryId: string) => void;
  onScrollToCategory?: (categoryId: string) => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const store = useNewsStore();
  const appWindow = getCurrentWindow();

  async function toggleFullscreen() {
    const isFullscreen = await appWindow.isFullscreen();
    await appWindow.setFullscreen(!isFullscreen);
  }

  async function openSelectedSources() {
    const selected = store.getSelectedSourcesData();
    for (const source of selected) {
      try {
        // Track the open count
        store.incrementOpenCount(source.id);

        if (source.isFile && source.filePath) {
          await openPath(source.filePath);
        } else {
          await openUrl(source.url);
        }
      } catch (error) {
        console.error('Failed to open:', error);
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // F11 - Toggle fullscreen
    if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
      return;
    }

    // Escape - clear selection or close modal
    if (e.key === 'Escape') {
      if (store.selectedSources.size > 0) {
        store.clearSelection();
      }
      store.setFocusedCategory(null);
      return;
    }

    // Don't trigger shortcuts when typing in input fields
    if (isInputFocused) return;

    const isMeta = e.metaKey || e.ctrlKey;

    // Cmd/Ctrl + B - Toggle sidebar
    if (isMeta && e.key === 'b') {
      e.preventDefault();
      options.onToggleSidebar?.();
      return;
    }

    // Cmd/Ctrl + K - Toggle frequently opened
    if (isMeta && e.key === 'k') {
      e.preventDefault();
      options.onToggleFrequentlyOpened?.();
      return;
    }

    // Cmd/Ctrl + N - Add category
    if (isMeta && e.key === 'n') {
      e.preventDefault();
      options.onAddCategory?.();
      return;
    }

    // Cmd/Ctrl + O - Open selected
    if (isMeta && e.key === 'o') {
      e.preventDefault();
      openSelectedSources();
      return;
    }

    // Cmd/Ctrl + A - Select all in focused category
    if (isMeta && e.key === 'a') {
      if (store.focusedCategoryId) {
        e.preventDefault();
        store.selectAllInCategory(store.focusedCategoryId);
      }
      return;
    }

    // Arrow Down - Next category
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextId = store.getNextCategoryId();
      if (nextId) {
        store.setFocusedCategory(nextId);
        options.onScrollToCategory?.(nextId);
      }
      return;
    }

    // Arrow Up - Previous category
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevId = store.getPrevCategoryId();
      if (prevId) {
        store.setFocusedCategory(prevId);
        options.onScrollToCategory?.(prevId);
      }
      return;
    }

    // Enter - Toggle collapse focused category
    if (e.key === 'Enter' && store.focusedCategoryId) {
      e.preventDefault();
      store.toggleCategoryCollapse(store.focusedCategoryId);
      return;
    }

    // Delete/Backspace - Delete focused category (with confirmation)
    if ((e.key === 'Delete' || e.key === 'Backspace') && store.focusedCategoryId) {
      e.preventDefault();
      options.onDeleteCategory?.(store.focusedCategoryId);
      return;
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
}