<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { X, Check } from 'lucide-vue-next';
import { CATEGORY_COLORS } from '../constants/colors';

const props = defineProps<{
  modelValue: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:visible', value: boolean): void;
}>();

const selectedColor = ref(props.modelValue);
const modalRef = ref<HTMLElement | null>(null);
const closeBtnRef = ref<HTMLElement | null>(null);
let previousFocus: HTMLElement | null = null;

watch(() => props.modelValue, (val) => {
  selectedColor.value = val;
});

watch(() => props.visible, (visible) => {
  if (visible) {
    previousFocus = document.activeElement as HTMLElement | null;
    nextTick(() => closeBtnRef.value?.focus());
  } else if (!visible && previousFocus) {
    const trigger = previousFocus;
    previousFocus = null;
    nextTick(() => trigger?.focus());
  }
});

function trapFocus(e: KeyboardEvent) {
  const modal = modalRef.value;
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

function selectPresetColor(color: string) {
  selectedColor.value = color;
}

function handleCustomColorChange(e: Event) {
  selectedColor.value = (e.target as HTMLInputElement).value;
}

function handleHexInput(e: Event) {
  const target = e.target as HTMLInputElement;
  let value = target.value;
  if (!value.startsWith('#')) {
    value = '#' + value;
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    selectedColor.value = value;
  }
}

function confirm() {
  emit('update:modelValue', selectedColor.value);
  emit('update:visible', false);
}

function cancel() {
  selectedColor.value = props.modelValue;
  emit('update:visible', false);
}

function isSelected(color: string) {
  return selectedColor.value.toLowerCase() === color.toLowerCase();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="color-picker-overlay" @click.self="cancel">
        <div
          ref="modalRef"
          class="color-picker-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="color-picker-modal-title"
          tabindex="-1"
          @keydown.escape="cancel"
          @keydown.tab="trapFocus"
        >
          <div class="modal-header">
            <h3 id="color-picker-modal-title" class="modal-title">Choose Color</h3>
            <button ref="closeBtnRef" class="btn btn-icon close-btn" aria-label="Close color picker" title="Close" @click="cancel">
              <X :size="18" />
            </button>
          </div>

          <div class="preset-colors" role="group" aria-label="Preset colors">
            <button
              v-for="color in CATEGORY_COLORS"
              :key="color.value"
              class="color-swatch"
              :class="{ selected: isSelected(color.value) }"
              :style="{ backgroundColor: color.value, color: color.value }"
              :title="color.name"
              :aria-label="`Use ${color.name} color`"
              :aria-pressed="isSelected(color.value)"
              @click="selectPresetColor(color.value)"
            >
              <Check v-if="isSelected(color.value)" :size="14" class="check-icon" />
            </button>
          </div>

          <div class="custom-color-section">
            <span class="section-label">Custom Color</span>
            <div class="custom-color-inputs">
              <input
                type="color"
                :value="selectedColor"
                class="color-input"
                aria-label="Pick custom color"
                @input="handleCustomColorChange"
              />
              <input
                type="text"
                :value="selectedColor"
                class="hex-input input"
                placeholder="#000000"
                aria-label="Hex color value"
                maxlength="7"
                @input="handleHexInput"
              />
            </div>
          </div>

          <div class="preview-section">
            <span class="section-label">Preview</span>
            <div class="preview-dot" :style="{ backgroundColor: selectedColor }" />
          </div>

          <div class="modal-actions">
            <button class="btn" @click="cancel">Cancel</button>
            <button class="btn btn-primary" @click="confirm">Apply</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.color-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.color-picker-modal {
  width: 320px;
  padding: var(--space-lg);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.close-btn {
  margin-right: calc(var(--space-sm) * -1);
}

.preset-colors {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.color-swatch {
  width: 100%;
  aspect-ratio: 1;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  transition: all var(--transition-fast);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-swatch:hover {
  transform: scale(1.1);
  z-index: 1;
}

.color-swatch.selected {
  box-shadow: 0 0 0 3px var(--color-bg-primary), 0 0 0 5px currentColor;
}

.check-icon {
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
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

.custom-color-section {
  margin-bottom: var(--space-lg);
}

.custom-color-inputs {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.color-input {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  padding: 0;
  background: transparent;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.hex-input {
  flex: 1;
  font-family: var(--font-mono);
  text-transform: uppercase;
}

.preview-section {
  margin-bottom: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.preview-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1), var(--shadow-sm);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}
</style>
