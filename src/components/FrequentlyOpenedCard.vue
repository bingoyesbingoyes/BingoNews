<script setup lang="ts">
import { computed } from 'vue';
import { TrendingUp, ExternalLink, File, CheckSquare, Square, Trash2 } from 'lucide-vue-next';
import { useNewsStore } from '../stores/newsStore';
import { SPECIAL_CATEGORY_IDS } from '../types';

const store = useNewsStore();

// Get top frequently opened sources (limit to 15)
const topSources = computed(() =>
  store.frequentlyOpenedSources.slice(0, 15)
);

const isFocused = computed(() =>
  store.focusedCategoryId === SPECIAL_CATEGORY_IDS.FREQUENTLY_OPENED
);

const selectedCount = computed(() => {
  return topSources.value.filter(s => store.selectedSources.has(s.id)).length;
});

const allSelected = computed(() => {
  return topSources.value.length > 0 &&
    topSources.value.every(s => store.selectedSources.has(s.id));
});

function toggleSelectAll() {
  if (allSelected.value) {
    topSources.value.forEach(s => {
      store.selectedSources.delete(s.id);
    });
  } else {
    topSources.value.forEach(s => {
      store.selectedSources.add(s.id);
    });
  }
}

function openSelected() {
  const selected = topSources.value.filter(s => store.selectedSources.has(s.id));
  return store.openSources(selected);
}

function handleCardClick() {
  store.setFocusedCategory(SPECIAL_CATEGORY_IDS.FREQUENTLY_OPENED);
}

function removeFromFrequent(sourceId: string) {
  store.clearOpenCount(sourceId);
}
</script>

<template>
  <div
    :id="`category-${SPECIAL_CATEGORY_IDS.FREQUENTLY_OPENED}`"
    class="frequently-opened-card card"
    :class="{ 'category-focused': isFocused }"
    @click="handleCardClick"
  >
    <div class="card-header">
      <TrendingUp :size="20" class="header-icon" />
      <h2 class="card-title">Frequently Opened</h2>
      <span class="source-count">{{ topSources.length }}</span>
      <div class="header-actions">
        <button
          v-if="selectedCount > 0"
          class="btn btn-primary open-selected-btn"
          @click.stop="openSelected"
        >
          <ExternalLink :size="14" />
          Open {{ selectedCount }}
        </button>
        <button
          class="btn btn-icon"
          @click.stop="toggleSelectAll"
          :title="allSelected ? 'Deselect All' : 'Select All'"
          :aria-label="allSelected ? 'Deselect all frequently opened sources' : 'Select all frequently opened sources'"
        >
          <CheckSquare v-if="allSelected" :size="16" />
          <Square v-else :size="16" />
        </button>
      </div>
    </div>

    <div class="card-content">
      <div
        v-for="source in topSources"
        :key="source.id"
        class="freq-source-item"
        :class="{ selected: store.selectedSources.has(source.id) }"
      >
        <input
          type="checkbox"
          class="checkbox"
          :checked="store.selectedSources.has(source.id)"
          :aria-label="`Select ${source.name}`"
          @change="store.toggleSourceSelection(source.id)"
          @click.stop
        />
        <div class="source-icon">
          <File v-if="source.isFile" :size="14" />
          <ExternalLink v-else :size="14" />
        </div>
        <div class="source-info">
          <span class="source-name" @click.stop="store.openSource(source)">{{ source.name }}</span>
          <span class="source-category" :style="{ color: source.categoryColor }">
            {{ source.categoryName }}
          </span>
        </div>
        <div class="source-actions">
          <button class="action-btn open-btn" @click.stop="store.openSource(source)" title="Open" :aria-label="`Open ${source.name}`">
            <ExternalLink :size="14" />
          </button>
          <button class="action-btn delete-btn" @click.stop="removeFromFrequent(source.id)" title="Remove from list" :aria-label="`Remove ${source.name} from frequently opened`">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>

      <div v-if="topSources.length === 0" class="empty-state">
        <p>No frequently opened links yet</p>
        <p class="hint">Start opening links to see them here</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.frequently-opened-card {
  border: 2px solid var(--color-accent);
  background: var(--color-accent-light);
  overflow: hidden;
}

.frequently-opened-card.category-focused {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 30%, transparent);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  border-bottom: 1px solid var(--color-border);
}

.header-icon {
  color: var(--color-accent);
}

.card-title {
  flex: 1;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.source-count {
  background: var(--color-accent);
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

[data-theme="dark"] .source-count {
  color: #1e1e2e;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.open-selected-btn {
  padding: var(--space-xs) var(--space-md);
  font-size: var(--font-size-xs);
}

.card-content {
  padding: var(--space-md);
  max-height: 400px;
  overflow-y: auto;
}

.freq-source-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.freq-source-item:hover {
  background: var(--item-bg-hover);
}

.freq-source-item.selected {
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.freq-source-item .checkbox {
  flex-shrink: 0;
}

.source-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.source-info {
  flex: 1;
  min-width: 0;
}

.source-name {
  display: block;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.source-name:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.source-category {
  display: block;
  font-size: var(--font-size-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.8;
}

.source-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.freq-source-item:hover .source-actions,
.freq-source-item:focus-within .source-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-bg-active);
}

.open-btn:hover {
  color: var(--color-accent);
}

.delete-btn:hover {
  color: var(--color-error);
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
}

.empty-state {
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-tertiary);
}

.hint {
  font-size: var(--font-size-sm);
  margin-top: var(--space-xs);
}
</style>
