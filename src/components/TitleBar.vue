<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();
const isMaximized = ref(false);
let unlisten: (() => void) | null = null;

onMounted(async () => {
  isMaximized.value = await appWindow.isMaximized();

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
}

async function close() {
  await appWindow.close();
}

function startDrag(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('.titlebar-traffic') || target.closest('.search-bar')) {
    return;
  }
  appWindow.startDragging();
}
</script>

<template>
  <header class="titlebar" @mousedown="startDrag">
    <div class="titlebar-left">
      <div class="titlebar-traffic" @mousedown.stop>
        <button class="traffic-btn traffic-close" aria-label="Close" title="Close" @click="close"></button>
        <button class="traffic-btn traffic-minimize" aria-label="Minimize" title="Minimize" @click="minimize"></button>
        <button
          class="traffic-btn traffic-zoom"
          :aria-label="isMaximized ? 'Restore' : 'Zoom'"
          :title="isMaximized ? 'Restore' : 'Zoom'"
          @click="toggleMaximize"
        ></button>
      </div>
    </div>

    <div class="titlebar-center">
      <slot></slot>
    </div>

    <div class="titlebar-right">
      <div class="titlebar-brand">
        <img class="app-icon" src="/app-icon.png" alt="BingoNews" />
        <h1 class="app-title">BingoNews</h1>
      </div>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  height: var(--titlebar-height);
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: 0 var(--space-lg);
  -webkit-app-region: drag;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-border);
}

.titlebar-left {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.titlebar-traffic {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.traffic-btn {
  width: 12px;
  height: 12px;
  border: none;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.15);
  transition: filter var(--transition-fast);
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.traffic-btn:hover {
  filter: brightness(0.92);
}

.traffic-btn:active {
  filter: brightness(0.78);
}

.traffic-close {
  background: #ff5f57;
}

.traffic-minimize {
  background: #febc2e;
}

.traffic-zoom {
  background: #28c840;
}

.traffic-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-bg-secondary), 0 0 0 4px var(--color-accent);
}

.titlebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
  -webkit-app-region: drag;
  app-region: drag;
}

.app-icon {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  object-fit: contain;
}

.app-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.titlebar-center {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.titlebar-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}
</style>
