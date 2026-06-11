<template>
  <div
    v-if="contextMenu.visible"
    class="context-menu win11-menu"
    :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    @click.stop
  >
    <template v-if="contextMenu.targetItem">
      <div class="menu-item bold" @click="handleItemOpen(contextMenu.targetItem)">
        <span class="menu-icon">📂</span>
        打开
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" @click="$emit('handle-cut')">
        <span class="menu-icon">✂️</span>
        剪切
      </div>
      <div class="menu-item" @click="$emit('handle-copy')">
        <span class="menu-icon">📋</span>
        复制
      </div>
      <div class="menu-item" @click="$emit('handle-rename-selected')">
        <span class="menu-icon">📝</span>
        重命名
      </div>
      <div class="menu-item" @click="$emit('handle-delete-selected')">
        <span class="menu-icon text-danger">🗑️</span>
        <span class="text-danger">删除</span>
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" @click="$emit('show-properties', contextMenu.targetItem)">
        <span class="menu-icon">ℹ️</span>
        属性
      </div>
    </template>
    <template v-else>
      <div class="menu-item" :class="{ disabled: !clipboard }" @click="$emit('handle-paste')">
        <span class="menu-icon">📥</span>
        粘贴
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" @click="$emit('handle-new-folder')">
        <span class="menu-icon">📁</span>
        新建文件夹
      </div>
      <div class="menu-item" @click="$emit('handle-new-file')">
        <span class="menu-icon">📄</span>
        新建文本文档
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { FileMetadata } from '@/services/fs'

interface ContextMenuData {
  visible: boolean
  x: number
  y: number
  targetItem: FileMetadata | null
}

interface Props {
  contextMenu: ContextMenuData
  selectedItemMeta: FileMetadata | null
  clipboard: { type: 'copy' | 'cut'; path: string; itemType: FileMetadata['type'] } | null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<Props>()

const emit = defineEmits<{
  'handle-item-open': [item: FileMetadata]
  'handle-cut': []
  'handle-copy': []
  'handle-rename-selected': [newName: string]
  'handle-delete-selected': []
  'show-properties': [item: FileMetadata | null]
  'handle-paste': []
  'handle-new-folder': []
  'handle-new-file': []
  'close-context-menu': []
}>()

const handleItemOpen = (item: FileMetadata) => {
  emit('handle-item-open', item)
}
</script>

<style scoped>
.context-menu {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 1000;
  min-width: 200px;
  font-size: 13px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: #1a1a1a;
  margin: 2px 0;
}

.menu-item:hover:not(.disabled) {
  background-color: rgba(0, 0, 0, 0.05);
}

.menu-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.menu-item.bold {
  font-weight: 600;
}

.menu-icon {
  font-size: 16px;
  margin-right: 12px;
  width: 20px;
  text-align: center;
}

.menu-separator {
  height: 1px;
  background-color: #e5e5e5;
  margin: 4px 0;
}

.text-danger {
  color: #d13438;
}
</style>
