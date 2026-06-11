<template>
  <div class="status-bar">
    <div class="status-item">{{ displayedContents?.length }} 个项目</div>
    <div v-if="selectedItem" class="status-divider"></div>
    <div v-if="selectedItem" class="status-item">选中 1 个项目</div>
    <div class="status-spacer"></div>
    <div class="status-item view-options">
      <span
        class="icon"
        :class="{ active: viewMode === 'details' }"
        title="详细信息"
        @click="$emit('set-view-mode', 'details')"
      >
        ≣
      </span>
      <span
        class="icon"
        :class="{ active: viewMode === 'icons' }"
        title="大图标"
        @click="$emit('set-view-mode', 'icons')"
      >
        ⊞
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileMetadata } from '@/services/fs'

interface Props {
  displayedContents: FileMetadata[]
  selectedItem: string | null
  viewMode: 'details' | 'icons'
}

defineProps<Props>()

defineEmits<{
  'set-view-mode': [mode: 'details' | 'icons']
}>()
</script>

<style scoped>
.status-bar {
  height: 28px;
  background-color: #f3f3f3;
  border-top: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  color: #444;
}

.status-item {
  padding: 0 8px;
}

.status-divider {
  width: 1px;
  height: 12px;
  background-color: #ccc;
  margin: 0 4px;
}

.status-spacer {
  flex: 1;
}

.view-options {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.view-options .icon {
  cursor: pointer;
  padding: 2px;
}

.view-options .active {
  color: #0067c0;
}
</style>
