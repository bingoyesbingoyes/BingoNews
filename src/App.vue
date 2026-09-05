<script setup lang="ts">
import { ref, nextTick, computed, watch, onMounted } from 'vue';
import draggable from 'vuedraggable';
import { useNewsStore } from './stores/newsStore';
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts';
import { useTheme } from './composables/useTheme';
import TitleBar from './components/TitleBar.vue';
import Sidebar from './components/Sidebar.vue';
import CategoryCard from './components/CategoryCard.vue';
import FrequentlyOpenedCard from './components/FrequentlyOpenedCard.vue';
import { Search, ExternalLink, X } from 'lucide-vue-next';
import type { Category } from './types';

useTheme();

const store = useNewsStore();

onMounted(async () => {
  await store.initConfigSync();
});

const showFrequentlyOpened = computed(() =>
  store.showFrequentlyOpened && store.frequentlyOpenedSources.length > 0
);
const contentRef = ref<HTMLElement | null>(null);
const searchQuery = ref('');
const sidebarVisible = ref(true);

const showDeleteConfirm = ref(false);
const categoryToDelete = ref<string | null>(null);
const deleteModalRef = ref<HTMLElement | null>(null);
const deleteCancelBtnRef = ref<HTMLElement | null>(null);
let previousModalTrigger: HTMLElement | null = null;

function restoreModalFocus() {
  if (previousModalTrigger) {
    const trigger = previousModalTrigger;
    previousModalTrigger = null;
    nextTick(() => trigger?.focus());
  }
}

watch(showDeleteConfirm, (visible) => {
  if (visible) {
    previousModalTrigger = document.activeElement as HTMLElement | null;
    nextTick(() => deleteCancelBtnRef.value?.focus());
  } else if (!visible) {
    restoreModalFocus();
  }
});

function trapTabFocus(modal: HTMLElement | null, e: KeyboardEvent) {
  if (!modal) return;
  const focusable = modal.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (e.shiftKey && (active === first || !modal.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !modal.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

function confirmDeleteCategory(categoryId: string) {
  categoryToDelete.value = categoryId;
  showDeleteConfirm.value = true;
}

function executeDelete() {
  if (categoryToDelete.value) {
    store.removeCategory(categoryToDelete.value);
    store.setFocusedCategory(null);
  }
  showDeleteConfirm.value = false;
  categoryToDelete.value = null;
}

function cancelDelete() {
  showDeleteConfirm.value = false;
  categoryToDelete.value = null;
}

const categories = ref<Category[]>([]);

watch(
  () => store.categories,
  (newVal) => {
    categories.value = [...newVal];
  },
  { immediate: true, deep: true }
);

function onCategoryDragEnd() {
  store.reorderCategories(categories.value);
}

function scrollToCategory(categoryId: string) {
  const element = document.getElementById(`category-${categoryId}`);
  if (element && contentRef.value) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

useKeyboardShortcuts({
  onToggleSidebar: () => { sidebarVisible.value = !sidebarVisible.value; },
  onToggleFrequentlyOpened: () => { store.toggleFrequentlyOpened(); },
  onAddCategory: () => { showAddCategoryModal.value = true; },
  onDeleteCategory: confirmDeleteCategory,
  onScrollToCategory: scrollToCategory
});

const showAddCategoryModal = ref(false);
const newCategoryName = ref('');
const addCategoryModalRef = ref<HTMLElement | null>(null);
const addCategoryNameInput = ref<HTMLInputElement | null>(null);

watch(showAddCategoryModal, (visible) => {
  if (visible) {
    previousModalTrigger = document.activeElement as HTMLElement | null;
    nextTick(() => addCategoryNameInput.value?.focus());
  } else if (!visible) {
    restoreModalFocus();
  }
});

function addCategory() {
  if (newCategoryName.value.trim()) {
    store.addCategory(newCategoryName.value.trim());
    newCategoryName.value = '';
    showAddCategoryModal.value = false;
    nextTick(() => {
      const lastCategory = store.categories[store.categories.length - 1];
      scrollToCategory(lastCategory.id);
    });
  }
}

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return store.categories;
  }

  const query = searchQuery.value.toLowerCase();
  return store.categories
    .map(cat => ({
      ...cat,
      sources: cat.sources.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.url.toLowerCase().includes(query)
      )
    }))
    .filter(cat => cat.sources.length > 0 || cat.name.toLowerCase().includes(query));
});

async function openAllSelected() {
  await store.openSources(store.getSelectedSourcesData());
}
</script>

<template>
  <div class="app-container">
    <TitleBar>
      <div class="search-bar">
        <Search :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Search"
          aria-label="Search sources"
        />
        <button
          v-if="searchQuery"
          class="search-clear"
          aria-label="Clear search"
          title="Clear search"
          @click="searchQuery = ''"
        >
          <X :size="14" />
        </button>
      </div>
    </TitleBar>

    <div class="app-body">
      <Transition name="sidebar">
        <Sidebar
          v-show="sidebarVisible"
          @scroll-to-category="scrollToCategory"
          @add-category="showAddCategoryModal = true"
        />
      </Transition>

      <main ref="contentRef" class="main-content">
        <!-- Floating action bar -->
        <Transition name="slide">
          <div v-if="store.selectedSources.size > 0" class="floating-bar">
            <span class="selected-count">
              {{ store.selectedSources.size }} selected
            </span>
            <button class="btn btn-primary" @click="openAllSelected">
              <ExternalLink :size="14" />
              Open All
            </button>
            <button class="btn" @click="store.clearSelection">
              Clear
            </button>
          </div>
        </Transition>

        <!-- Frequently Opened Card (pinned at top) -->
        <div v-if="showFrequentlyOpened && !searchQuery" class="frequently-opened-wrapper">
          <FrequentlyOpenedCard />
        </div>

        <!-- Categories -->
        <draggable
          v-model="categories"
          item-key="id"
          ghost-class="sortable-ghost"
          :animation="200"
          :force-fallback="true"
          :fallback-on-body="true"
          class="categories-container"
          @end="onCategoryDragEnd"
        >
          <template #item="{ element }">
            <div :id="`category-${element.id}`" class="category-wrapper">
              <CategoryCard
                v-if="!searchQuery || filteredCategories.some(c => c.id === element.id)"
                :category="element"
                @delete-category="confirmDeleteCategory(element.id)"
              />
            </div>
          </template>
        </draggable>

        <!-- Empty state -->
        <div v-if="store.categories.length === 0" class="empty-state-main">
          <div class="empty-icon">B</div>
          <h2>Welcome to BingoNews</h2>
          <p>Start by adding a category to organize your news sources</p>
          <button class="btn btn-primary" @click="showAddCategoryModal = true">
            Add Your First Category
          </button>
        </div>

        <!-- No search results -->
        <div v-else-if="searchQuery && filteredCategories.length === 0" class="empty-state-main">
          <div class="empty-icon">
            <Search :size="32" />
          </div>
          <h2>No Results</h2>
          <p>No sources match “{{ searchQuery }}”. Try a different search.</p>
          <button class="btn" @click="searchQuery = ''">Clear Search</button>
        </div>
      </main>
    </div>

    <!-- Add Category Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showAddCategoryModal" class="modal-overlay" @click.self="showAddCategoryModal = false">
          <div
            ref="addCategoryModalRef"
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-category-modal-title"
            tabindex="-1"
            @keydown.escape="showAddCategoryModal = false"
            @keydown.tab="trapTabFocus(addCategoryModalRef, $event)"
          >
            <h3 id="new-category-modal-title" class="modal-title">New Category</h3>
            <input
              ref="addCategoryNameInput"
              v-model="newCategoryName"
              type="text"
              class="input modal-input"
              placeholder="Category name"
              aria-label="Category name"
              @keydown.enter="addCategory"
              @keydown.escape="showAddCategoryModal = false"
            />
            <div class="modal-actions">
              <button class="btn" @click="showAddCategoryModal = false">Cancel</button>
              <button class="btn btn-primary" @click="addCategory">Create</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
          <div
            ref="deleteModalRef"
            class="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            tabindex="-1"
            @keydown.escape="cancelDelete"
            @keydown.tab="trapTabFocus(deleteModalRef, $event)"
          >
            <h3 id="delete-modal-title" class="modal-title">Delete Category</h3>
            <p class="modal-message">
              Are you sure you want to delete this category? All sources within it will be removed.
            </p>
            <div class="modal-actions">
              <button ref="deleteCancelBtnRef" class="btn" @click="cancelDelete">Cancel</button>
              <button class="btn btn-danger" @click="executeDelete">Delete</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: var(--app-bg, transparent);
  background-color: var(--app-bg-color, transparent);
  border-radius: 12px;
  overflow: hidden;
}

.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xl);
  position: relative;
  -webkit-app-region: no-drag;
  background: transparent;
}

.categories-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: var(--space-lg);
  max-width: 1800px;
  margin: 0 auto;
}

.frequently-opened-wrapper {
  max-width: 600px;
  margin: 0 auto var(--space-xl) auto;
}

/* Responsive breakpoints for grid */
@media (min-width: 1400px) {
  .categories-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) and (max-width: 1399px) {
  .categories-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 899px) {
  .categories-container {
    grid-template-columns: 1fr;
  }
}

.category-wrapper {
  cursor: grab;
}

.category-wrapper:active {
  cursor: grabbing;
}

/* Search bar */
.search-bar {
  display: flex;
  align-items: center;
  width: 300px;
  background: var(--item-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 var(--space-md);
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.search-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.search-clear {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  background: var(--color-bg-active);
}

/* Floating bar */
.floating-bar {
  position: fixed;
  bottom: var(--space-xl);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 100;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
}

.selected-count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

/* Empty state */
.empty-state-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--color-text-secondary);
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, #5856d6));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  color: white;
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-lg);
}

.empty-state-main h2 {
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}

.empty-state-main p {
  margin-bottom: var(--space-lg);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 400px;
  padding: var(--space-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-lg);
}

.modal-input {
  width: 100%;
  margin-bottom: var(--space-lg);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.modal-message {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  margin-bottom: var(--space-lg);
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-danger:hover {
  background: color-mix(in srgb, var(--color-error) 82%, #000);
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all var(--transition-normal);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

/* Sidebar transition */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all var(--transition-normal);
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
  transform: translateX(-100%);
  margin-left: calc(var(--sidebar-width) * -1);
}
</style>
