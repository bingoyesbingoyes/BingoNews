<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';

const props = defineProps<{
  value: string;
  tag?: string;
}>();

const emit = defineEmits<{
  (e: 'update', value: string): void;
}>();

const isEditing = ref(false);
const editValue = ref(props.value);
const inputRef = ref<HTMLInputElement | null>(null);

watch(() => props.value, (newVal) => {
  editValue.value = newVal;
});

function startEditing() {
  isEditing.value = true;
  editValue.value = props.value;
  nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
}

function save() {
  if (editValue.value.trim() && editValue.value !== props.value) {
    emit('update', editValue.value.trim());
  }
  isEditing.value = false;
}

function cancel() {
  editValue.value = props.value;
  isEditing.value = false;
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    save();
  } else if (e.key === 'Escape') {
    cancel();
  }
}
</script>

<template>
  <input
    v-if="isEditing"
    ref="inputRef"
    v-model="editValue"
    class="editable-input"
    :aria-label="`Rename ${value}`"
    @blur="save"
    @keydown="handleKeydown"
    @click.stop
  />
  <component
    v-else
    :is="tag || 'span'"
    class="editable-text"
    role="button"
    tabindex="0"
    :title="`Rename: ${value}`"
    @dblclick="startEditing"
    @keydown.enter.prevent="startEditing"
    @keydown.space.prevent="startEditing"
    @keydown.f2.prevent="startEditing"
  >
    {{ value }}
  </component>
</template>

<style scoped>
.editable-text {
  cursor: text;
  border-radius: var(--radius-sm);
  padding: 2px 4px;
  margin: -2px -4px;
  transition: background var(--transition-fast);
}

.editable-text:hover {
  background: var(--color-bg-hover);
}

.editable-input {
  font: inherit;
  color: inherit;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  padding: 2px 4px;
  margin: -3px -5px;
  outline: none;
  box-shadow: 0 0 0 3px var(--color-accent-light);
  width: calc(100% + 10px);
}
</style>
