<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Maximize2 } from 'lucide-vue-next';

const appWindow = getCurrentWindow();
const isMaximized = ref(false);
let unlisten: (() => void) | null = null;

// Sync isMaximized state with actual window state
onMounted(async () => {
  // Check initial state
  isMaximized.value = await appWindow.isMaximized();

  // Listen for window resize events to sync state
  unlisten = await appWindow.onResized(async () => {
    isMaximized.value = await appWindow.isMaximized();
  });
});

onUnmounted(() => {
  if (unlisten) {
    unlisten();
  }
});

async function minimize() {
  await appWindow.minimize();
}

async function toggleMaximize() {
  await appWindow.toggleMaximize();
  // State will be synced by onResized listener
}

async function close() {
  await appWindow.close();
}

function startDrag(e: MouseEvent) {
  // Don't start drag if clicking on interactive elements
  const target = e.target as HTMLElement;
  if (target.closest('.titlebar-right') || target.closest('.search-bar') || target.closest('button') || target.closest('input')) {
    return;
  }
  appWindow.startDragging();
}
</script>

<template>
  <header class="titlebar glass" @mousedown="startDrag">
    <div class="titlebar-left">
      <img class="app-icon" src="/app-icon.png" alt="BingoNews" />
      <h1 class="app-title">BingoNews</h1>
    </div>

    <div class="titlebar-center">
      <slot></slot>
    </div>

    <div class="titlebar-right" @mousedown.stop>
      <button class="window-btn minimize" @click="minimize" title="Minimize">
        <Minus :size="14" />
      </button>
      <button class="window-btn maximize" @click="toggleMaximize" title="Maximize">
        <component :is="isMaximized ? Square : Maximize2" :size="12" />
      </button>
      <button class="window-btn close" @click="close" title="Close">
        <X :size="14" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  height: var(--titlebar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-lg);
  -webkit-app-region: drag;
  background: transparent;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.app-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  object-fit: contain;
}

.app-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.titlebar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.titlebar-right {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  -webkit-app-region: no-drag;
  app-region: no-drag;
  position: relative;
  z-index: 100;
}

.window-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  -webkit-app-region: no-drag;
  app-region: no-drag;
  pointer-events: auto;
}

.window-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.window-btn.close:hover {
  background: var(--color-error);
  color: white;
}
</style>