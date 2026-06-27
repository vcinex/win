<template>
  <div class="address-bar-container">
    <div class="nav-buttons">
      <button :disabled="!canGoBack" @click="$emit('go-back')">⬅</button>
      <button :disabled="!canGoForward" @click="$emit('go-forward')">➡</button>
      <button :disabled="currentPath === ''" @click="$emit('go-up')">⬆</button>
      <button @click="$emit('force-refresh')">🔄</button>
    </div>

    <div class="path-input-area" @click.self="startEdit">
      <input
        v-if="isEditingPath"
        ref="pathInputRef"
        :value="pathInput"
        class="real-input"
        @input="$emit('update:pathInput', ($event.target as HTMLInputElement).value)"
        @blur="$emit('submit-path')"
        @keyup.enter="$emit('submit-path')"
      />
      <div v-else class="breadcrumb" @click.self="startEdit">
        <div class="crumb" @click="$emit('navigate-to', '')">💻 此电脑</div>
        <template v-for="(segment, index) in pathSegments" :key="index">
          <div class="separator">›</div>
          <div class="crumb" @click="$emit('navigate-to-segment', index)">
            {{ segment }}
          </div>
        </template>
      </div>
    </div>

    <div class="search-box">
      <input
        type="text"
        placeholder="搜索..."
        @input="$emit('search-change', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';

const props = defineProps<{
  currentPath: string;
  pathSegments: string[];
  isEditingPath: boolean;
  pathInput: string;
  canGoBack: boolean;
  canGoForward: boolean;
}>();

const emit = defineEmits([
  'go-back',
  'go-forward',
  'go-up',
  'navigate-to',
  'navigate-to-segment',
  'start-editing-path',
  'submit-path',
  'force-refresh',
  'update:pathInput',
  'search-change'
]);

const pathInputRef = ref<HTMLInputElement | null>(null);

const startEdit = async () => {
  emit('start-editing-path');
  await nextTick();
  pathInputRef.value?.focus();
  pathInputRef.value?.select();
};

defineExpose({ focusPathInput: () => pathInputRef.value?.focus() });
</script>

<style scoped>
.address-bar-container {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #f3f3f3;
  border-bottom: 1px solid #e1e1e1;
  align-items: center;
}
.nav-buttons button {
  background: transparent;
  border: none;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.nav-buttons button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}
.nav-buttons button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.path-input-area {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #d1d1d1;
  border-radius: 4px;
  height: 32px;
  padding: 0 8px;
  cursor: text;
}
.real-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
}
.breadcrumb {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}
.crumb {
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.crumb:hover {
  background: rgba(0, 0, 0, 0.05);
}
.separator {
  margin: 0 4px;
  color: #888;
  font-size: 14px;
}
.search-box input {
  height: 32px;
  border: 1px solid #d1d1d1;
  border-radius: 4px;
  padding: 0 8px;
  outline: none;
}
</style>
