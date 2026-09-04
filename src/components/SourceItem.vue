<script setup lang="ts">
import { computed } from 'vue';
import { ExternalLink, Trash2, File, GripVertical } from 'lucide-vue-next';
import type { Source } from '../types';
import { useNewsStore } from '../stores/newsStore';
import EditableText from './EditableText.vue';

const store = useNewsStore();

const props = defineProps<{
  source: Source;
  selected: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'remove'): void;
  (e: 'updateName', name: string): void;
}>();

const isFile = computed(() => props.source.isFile);
</script>

<template>
  <div class="source-item" :class="{ selected, 'is-file': isFile }">
    <div class="drag-handle">
      <GripVertical :size="14" />
    </div>

    <input
      type="checkbox"
      class="checkbox"
      :checked="selected"
      @change="emit('toggle')"
    />

    <div class="source-icon">
      <File v-if="isFile" :size="14" />
      <ExternalLink v-else :size="14" />
    </div>

    <div class="source-name-wrapper">
      <EditableText
        :value="source.name"
        class="source-name"
        :title="source.url"
        @update="emit('updateName', $event)"
      />
    </div>

    <div class="source-actions">
      <button class="action-btn open-btn" @click="store.openSource(source)" title="Open">
        <ExternalLink :size="14" />
      </button>
      <button class="action-btn delete-btn" @click="emit('remove')" title="Delete">
        <Trash2 :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.source-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background: var(--item-bg);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}

.source-item:hover {
  background: var(--item-bg-hover);
  border-color: var(--color-border);
}

.source-item.selected {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
}

.drag-handle {
  cursor: grab;
  color: var(--color-text-tertiary);
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.drag-handle:hover {
  background: var(--color-bg-active);
  color: var(--color-text-secondary);
}

.drag-handle:active {
  cursor: grabbing;
}

.source-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.source-name-wrapper {
  flex: 1;
  min-width: 0;
}

.source-name-wrapper :deep(.source-name) {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-actions {
  display: flex;
  gap: var(--space-xs);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.source-item:hover .source-actions {
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
  background: rgba(255, 59, 48, 0.1);
}

.is-file .source-icon {
  color: var(--color-accent);
}
</style>
