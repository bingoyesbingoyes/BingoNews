<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import draggable from 'vuedraggable';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  ExternalLink,
  GripVertical,
  FileText
} from 'lucide-vue-next';
import { openPath, openUrl } from '@tauri-apps/plugin-opener';
import { useNewsStore } from '../stores/newsStore';
import EditableText from './EditableText.vue';
import SourceItem from './SourceItem.vue';
import ColorPickerModal from './ColorPickerModal.vue';
import { DEFAULT_CATEGORY_COLOR } from '../constants/colors';
import type { Category, Source } from '../types';

const props = defineProps<{
  category: Category;
}>();

const store = useNewsStore();

const isCollapsed = computed(() => props.category.collapsed);
const categoryColor = computed(() => props.category.color || DEFAULT_CATEGORY_COLOR);
const showColorPicker = ref(false);
const isFocused = computed(() => store.focusedCategoryId === props.category.id);

function handleCardClick() {
  store.setFocusedCategory(props.category.id);
}

function updateColor(newColor: string) {
  store.updateCategoryColor(props.category.id, newColor);
}

// Use a simple ref array for draggable
const sources = ref<Source[]>([]);

// Initialize and watch for external changes
watch(
  () => props.category.sources,
  (newVal) => {
    sources.value = [...newVal];
  },
  { immediate: true, deep: true }
);

// Close add form when category is collapsed
watch(isCollapsed, (collapsed) => {
  if (collapsed && showAddForm.value) {
    cancelAdd();
  }
});

// Handle drag end
function handleDragEnd() {
  const idx = store.categories.findIndex(c => c.id === props.category.id);
  if (idx !== -1) {
    store.categories[idx].sources = [...sources.value];
  }
}

const selectedCount = computed(() => {
  return props.category.sources.filter(s => store.selectedSources.has(s.id)).length;
});

const allSelected = computed(() => {
  return props.category.sources.length > 0 &&
    props.category.sources.every(s => store.selectedSources.has(s.id));
});

function toggleCollapse() {
  store.toggleCategoryCollapse(props.category.id);
}

function toggleSelectAll() {
  if (allSelected.value) {
    store.deselectAllInCategory(props.category.id);
  } else {
    store.selectAllInCategory(props.category.id);
  }
}

async function openSelected() {
  const selected = props.category.sources.filter(s => store.selectedSources.has(s.id));
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

// Add new source
const showAddForm = ref(false);
const newSourceName = ref('');
const newSourceUrl = ref('');
const addMode = ref<'url' | 'file'>('url');

function addSource() {
  if (newSourceName.value.trim() && newSourceUrl.value.trim()) {
    const isFile = addMode.value === 'file';
    store.addSource(props.category.id, {
      name: newSourceName.value.trim(),
      url: newSourceUrl.value.trim(),
      isFile: isFile,
      filePath: isFile ? newSourceUrl.value.trim() : undefined
    });
    newSourceName.value = '';
    newSourceUrl.value = '';
    showAddForm.value = false;
    addMode.value = 'url';

    // Scroll category content to top
    nextTick(() => {
      if (categoryContentRef.value) {
        categoryContentRef.value.scrollTop = 0;
      }
    });
  }
}

function cancelAdd() {
  newSourceName.value = '';
  newSourceUrl.value = '';
  showAddForm.value = false;
  addMode.value = 'url';
}

function openAddForm() {
  // Expand category if collapsed
  if (isCollapsed.value) {
    store.toggleCategoryCollapse(props.category.id);
  }
  showAddForm.value = true;
}

// File picker using Tauri dialog
async function pickFile() {
  try {
    const { open: openDialog } = await import('@tauri-apps/plugin-dialog');
    const selected = await openDialog({
      multiple: true,
      title: 'Select files or applications'
    });

    if (selected) {
      const files = Array.isArray(selected) ? selected : [selected];
      files.forEach(filePath => {
        // Extract filename from path
        const fileName = filePath.split(/[/\\]/).pop() || filePath;
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

        store.addSource(props.category.id, {
          name: nameWithoutExt,
          url: filePath,
          isFile: true,
          filePath: filePath
        });
      });

      // Scroll category content to top
      nextTick(() => {
        if (categoryContentRef.value) {
          categoryContentRef.value.scrollTop = 0;
        }
      });
    }
  } catch (error) {
    console.error('Failed to open file dialog:', error);
  }
}

// Drop zone for files
const isDragOver = ref(false);
const categoryContentRef = ref<HTMLElement | null>(null);

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave() {
  isDragOver.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = false;

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    Array.from(files).forEach(file => {
      // For Tauri, we get the actual file path
      const path = (file as any).path || file.name;
      store.addSource(props.category.id, {
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for display
        url: path,
        isFile: true,
        filePath: path
      });
    });
  }
}
</script>

<template>
  <div
    class="category-card card"
    :class="{ 'drag-over': isDragOver, 'category-focused': isFocused }"
    :style="isFocused ? { '--focus-color': categoryColor } : {}"
    @click="handleCardClick"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="category-header">
      <div class="category-drag-handle">
        <GripVertical :size="16" />
      </div>

      <button
        class="color-dot-btn"
        :style="{ backgroundColor: categoryColor }"
        title="Change color"
        @click="showColorPicker = true"
      />

      <button class="collapse-btn" @click="toggleCollapse">
        <ChevronRight v-if="isCollapsed" :size="18" />
        <ChevronDown v-else :size="18" />
      </button>

      <EditableText
        :value="category.name"
        tag="h2"
        class="category-title"
        @update="store.updateCategoryName(category.id, $event)"
      />

      <span class="source-count">{{ category.sources.length }}</span>

      <div class="category-actions">
        <button
          v-if="selectedCount > 0"
          class="btn btn-primary open-selected-btn"
          @click="openSelected"
        >
          <ExternalLink :size="14" />
          Open {{ selectedCount }}
        </button>

        <button
          class="btn btn-icon"
          @click="toggleSelectAll"
          :title="allSelected ? 'Deselect All' : 'Select All'"
        >
          <CheckSquare v-if="allSelected" :size="16" />
          <Square v-else :size="16" />
        </button>

        <button
          class="btn btn-icon"
          @click="pickFile"
          title="Add File/App"
        >
          <FileText :size="16" />
        </button>

        <button
          class="btn btn-icon"
          @click="openAddForm"
          title="Add URL"
        >
          <Plus :size="16" />
        </button>

        <button
          class="btn btn-icon delete-btn"
          @click="store.removeCategory(category.id)"
          title="Delete Category"
        >
          <Trash2 :size="16" />
        </button>
      </div>
    </div>

    <div v-if="!isCollapsed" ref="categoryContentRef" class="category-content">
      <!-- Add form -->
      <div v-if="showAddForm" class="add-form">
        <input
          v-model="newSourceName"
          type="text"
          class="input"
          placeholder="Name"
          @keydown.enter="addSource"
          @keydown.escape="cancelAdd"
        />
        <input
          v-model="newSourceUrl"
          type="text"
          class="input"
          placeholder="URL"
          @keydown.enter="addSource"
          @keydown.escape="cancelAdd"
        />
        <div class="add-form-actions">
          <button class="btn" @click="cancelAdd">Cancel</button>
          <button class="btn btn-primary" @click="addSource">Add</button>
        </div>
      </div>

      <!-- Sources list -->
      <draggable
        v-model="sources"
        item-key="id"
        ghost-class="sortable-ghost"
        :animation="200"
        :force-fallback="true"
        :fallback-on-body="true"
        :group="{ name: 'sources', pull: true, put: true }"
        class="sources-list"
        @end="handleDragEnd"
      >
        <template #item="{ element }">
          <div :id="`source-${element.id}`" class="source-item-wrapper">
            <SourceItem
              :source="element"
              :selected="store.selectedSources.has(element.id)"
              @toggle="store.toggleSourceSelection(element.id)"
              @remove="store.removeSource(category.id, element.id)"
              @update-name="store.updateSource(category.id, element.id, { name: $event })"
            />
          </div>
        </template>
      </draggable>

      <!-- Empty state -->
      <div v-if="category.sources.length === 0 && !showAddForm" class="empty-state">
        <p>No sources yet</p>
        <p class="empty-hint">Click 📄 to add files, + to add URLs, or drop files here</p>
      </div>
    </div>

    <!-- Color Picker Modal -->
    <ColorPickerModal
      :model-value="categoryColor"
      :visible="showColorPicker"
      @update:model-value="updateColor"
      @update:visible="showColorPicker = $event"
    />
  </div>
</template>

<style scoped>
.category-card {
  overflow: hidden;
  transition: all var(--transition-normal);
  height: fit-content;
}

.category-card.drag-over {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.category-card.category-focused {
  border-color: var(--focus-color, var(--color-accent));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-color, var(--color-accent)) 30%, transparent);
}

.category-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg-hover);
  border-bottom: 1px solid var(--color-border);
}

.category-drag-handle {
  cursor: grab;
  color: var(--color-text-tertiary);
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.category-drag-handle:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.category-drag-handle:active {
  cursor: grabbing;
}

.color-dot-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1), var(--shadow-sm);
  transition: all var(--transition-fast);
}

.color-dot-btn:hover {
  transform: scale(1.15);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1), var(--shadow-md);
}

.collapse-btn {
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

.collapse-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.category-title {
  flex: 1;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.source-count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: var(--item-bg);
  padding: 2px 10px;
  border-radius: 12px;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.open-selected-btn {
  padding: var(--space-xs) var(--space-md);
  font-size: var(--font-size-xs);
}

.delete-btn:hover {
  color: var(--color-error);
  background: rgba(255, 59, 48, 0.1);
}

.category-content {
  padding: var(--space-md);
  max-height: 400px;
  overflow-y: auto;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-height: 40px;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-bg-hover);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-md);
  border: 1px solid var(--color-border);
}

.add-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.empty-state {
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-tertiary);
}

.empty-hint {
  font-size: var(--font-size-sm);
  margin-top: var(--space-xs);
}

.source-item-wrapper {
  cursor: grab;
}

.source-item-wrapper:active {
  cursor: grabbing;
}
</style>