<template>
  <div class="command-bar">
    <div class="cmd-group relative">
      <button class="cmd-btn" @click.stop="$emit('toggle-new-menu')">
        <span class="icon text-primary">➕</span>
        新建
      </button>
      <div v-if="newMenuVisible" class="dropdown-menu win11-menu" @click.stop>
        <div class="menu-item" @click="$emit('handle-new-folder')">
          <span class="menu-icon">📁</span>
          文件夹
        </div>
        <div class="menu-item" @click="$emit('handle-new-file')">
          <span class="menu-icon">📄</span>
          文本文档
        </div>
      </div>
    </div>

    <div class="cmd-divider"></div>

    <div class="cmd-group">
      <button
        class="cmd-icon-btn"
        title="剪切"
        :disabled="!selectedItem"
        @click.stop="$emit('handle-cut')"
      >
        <span class="icon">✂️</span>
      </button>
      <button
        class="cmd-icon-btn"
        title="复制"
        :disabled="!selectedItem"
        @click.stop="$emit('handle-copy')"
      >
        <span class="icon">📋</span>
      </button>
      <button
        class="cmd-icon-btn"
        title="粘贴"
        :disabled="!clipboard"
        @click.stop="$emit('handle-paste')"
      >
        <span class="icon">📥</span>
      </button>
      <button
        class="cmd-icon-btn"
        title="重命名"
        :disabled="!selectedItem"
        @click.stop="$emit('handle-rename-selected')"
      >
        <span class="icon">📝</span>
      </button>
      <button
        class="cmd-icon-btn"
        title="共享"
        :disabled="!selectedItem"
        @click.stop="$emit('handle-share')"
      >
        <span class="icon">🔗</span>
      </button>
      <button
        class="cmd-icon-btn"
        title="删除"
        :disabled="!selectedItem"
        @click.stop="$emit('handle-delete-selected')"
      >
        <span class="icon">🗑️</span>
      </button>
    </div>

    <div class="cmd-divider"></div>

    <div class="cmd-group">
      <button class="cmd-btn" title="切换排序方式" @click.stop="$emit('toggle-sort')">
        <span class="icon">🔃</span>
        {{ sortLabel }}
      </button>
      <button class="cmd-btn" title="切换视图" @click.stop="$emit('toggle-view-mode')">
        <span class="icon">🪟</span>
        {{ viewMode === 'details' ? '详细信息' : '大图标' }}
      </button>
    </div>
    <div class="cmd-spacer"></div>
    <button
      class="cmd-icon-btn"
      title="属性"
      :disabled="!selectedItemMeta"
      @click.stop="$emit('show-properties', selectedItemMeta)"
    >
      <span class="icon">ℹ️</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { FileMetadata } from '@/types';

interface Props {
  selectedItem: string | null;
  clipboard: { type: 'copy' | 'cut'; paths: string[] } | null;
  newMenuVisible: boolean;
  sortLabel: string;
  viewMode: 'details' | 'icons';
  selectedItemMeta: FileMetadata | null;
}

defineProps<Props>();

defineEmits<{
  'toggle-new-menu': [];
  'handle-cut': [];
  'handle-copy': [];
  'handle-paste': [];
  'handle-share': [];
  'handle-delete-selected': [];
  'toggle-sort': [];
  'toggle-view-mode': [];
  'show-properties': [item: FileMetadata | null];
  'handle-new-folder': [];
  'handle-new-file': [];
  'close-new-menu': [];
  'handle-rename-selected': [newName?: string];
}>();
</script>

<style scoped>
.command-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f3f3f3;
  border-bottom: 1px solid #e5e5e5;
  height: 48px;
  box-sizing: border-box;
}

.cmd-group {
  display: flex;
  gap: 2px;
  align-items: center;
}

.relative {
  position: relative;
}

.cmd-divider {
  width: 1px;
  height: 16px;
  background-color: #cccccc;
  margin: 0 8px;
}

.cmd-spacer {
  flex: 1;
}

.cmd-btn,
.cmd-icon-btn {
  background: transparent;
  border: 0px solid transparent;
  border-radius: 0px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #1a1a1a;
  transition: all 0.1s ease;
}

.cmd-btn {
  padding: 6px 12px;
  font-size: 13px;
}

.cmd-icon-btn {
  padding: 6px;
  font-size: 15px;
  width: 32px;
  height: 32px;
  justify-content: center;
}

.cmd-btn:hover:not(:disabled),
.cmd-icon-btn:hover:not(:disabled) {
  background-color: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border-color: #e5e5e5;
}

.cmd-btn:active:not(:disabled),
.cmd-icon-btn:active:not(:disabled) {
  background-color: #f9f9f9;
}

.cmd-btn:disabled,
.cmd-icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.text-primary {
  color: #0067c0;
}

.dropdown-menu {
  top: 100%;
  left: 0;
  margin-top: 4px;
}

.win11-menu {
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
</style>
