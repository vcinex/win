<template>
  <div
    class="main-content"
    :class="viewMode"
    @click.self="clearSelection"
    @contextmenu.prevent.self="$emit('open-blank-context-menu', $event)"
    @dragover.prevent
    @drop.prevent="handleDropBlank"
  >
    <div v-if="viewMode === 'details'" class="list-header">
      <div></div>
      <div class="col-name" @click="$emit('change-sort', 'name')">名称 {{ sortIcon('name') }}</div>
      <div class="col-mtime" @click="$emit('change-sort', 'mtime')">
        修改日期 {{ sortIcon('mtime') }}
      </div>
      <div class="col-type" @click="$emit('change-sort', 'type')">类型 {{ sortIcon('type') }}</div>
      <div class="col-size" @click="$emit('change-sort', 'size')">大小 {{ sortIcon('size') }}</div>
    </div>

    <div
      v-for="item in visibleContents"
      :key="item.path"
      class="item"
      :class="{ selected: selectedItems.has(item.path), cut: isCut(item.path) }"
      draggable="true"
      @dragstart="handleDragStart($event, item)"
      @dragover.prevent="handleDragOver($event, item)"
      @drop.prevent="handleDrop($event, item)"
      @click.stop="handleItemClick($event, item)"
      @dblclick.stop="$emit('handle-item-open', item)"
      @contextmenu.prevent.stop="$emit('open-item-context-menu', $event, item)"
    >
      <div class="item-icon">{{ getIcon(item) }}</div>

      <div v-if="renamingPath === item.path" class="item-name-input-wrap">
        <input
          ref="renameInputRef"
          v-model="renameValue"
          @blur="finishRename"
          @keyup.enter="finishRename"
          @keyup.esc="cancelRename"
          @click.stop
        />
      </div>
      <div v-else class="item-name">{{ item.name }}</div>

      <template v-if="viewMode === 'details'">
        <div class="item-mtime">{{ formatDate(item.mtime) }}</div>
        <div class="item-type">{{ getTypeName(item) }}</div>
        <div class="item-size">{{ formatSize(item.size) }}</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';

import type { FileMetadata } from '@/types';

const props = defineProps<{
  currentPath: string;
  clipboard: any | null;
  displayedContents: FileMetadata[];
  selectedItems: Set<string>;
  viewMode: 'details' | 'icons';
  sortField: string;
  sortDesc: boolean;
}>();

const emit = defineEmits([
  'select-item',
  'clear-selection',
  'handle-item-open',
  'open-item-context-menu',
  'open-blank-context-menu',
  'change-sort',
  'handle-rename-selected',
  'handle-move-items'
]);

const visibleContents = computed(() => props.displayedContents.slice(0, 200));

const sortIcon = (field: string) => (props.sortField === field ? (props.sortDesc ? '↓' : '↑') : '');

const isCut = (path: string) =>
  props.clipboard?.type === 'cut' && props.clipboard.paths?.includes(path);

const handleItemClick = (e: MouseEvent, item: any) => {
  emit('select-item', { path: item.path, ctrlKey: e.ctrlKey || e.metaKey, shiftKey: e.shiftKey });
};
const clearSelection = () => emit('clear-selection');

const renamingPath = ref<string | null>(null);
const renameValue = ref('');
const renameInputRef = ref<HTMLInputElement | null>(null);

const startRename = async (path: string) => {
  renamingPath.value = path;
  const item = props.displayedContents.find((i) => i.path === path);
  renameValue.value = item ? item.name : '';
  await nextTick();
  renameInputRef.value?.focus();
};
const finishRename = () => {
  if (renamingPath.value) {
    emit('handle-rename-selected', renameValue.value);
    renamingPath.value = null;
  }
};
const cancelRename = () => {
  renamingPath.value = null;
};

defineExpose({ startRename });

const handleDragStart = (e: DragEvent, item: any) => {
  if (!props.selectedItems.has(item.path)) {
    emit('select-item', { path: item.path, ctrlKey: false, shiftKey: false });
  }
  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('application/json', JSON.stringify(Array.from(props.selectedItems)));
};
const handleDragOver = (e: DragEvent, item: any) => {
  if (item.type === 'directory' && !props.selectedItems.has(item.path)) {
    e.dataTransfer!.dropEffect = 'move';
  } else {
    e.dataTransfer!.dropEffect = 'none';
  }
};
const handleDrop = (e: DragEvent, item: any) => {
  if (item.type !== 'directory') return;
  const data = e.dataTransfer!.getData('application/json');
  if (data) {
    const sourcePaths = JSON.parse(data);
    emit('handle-move-items', sourcePaths, item.path);
  }
};
const handleDropBlank = (e: DragEvent) => {
  console.log('拦截到拖入空白区域', e.dataTransfer?.files);
};

const getIcon = (item: any) => (item.type === 'directory' ? '📁' : '📄');
const getTypeName = (item: any) => (item.type === 'directory' ? '文件夹' : '文件');
const formatSize = (bytes: number) => (bytes ? `${(bytes / 1024).toFixed(1)} KB` : '');
const formatDate = (ts: number) => new Date(ts).toLocaleDateString();
</script>

<style scoped>
.main-content {
  padding: 8px;
  flex: 1;
  overflow-y: auto;
  background-color: #ffffff;
  min-width: 0;
}

.main-content.details .list-header,
.main-content.details .item {
  display: grid;
  grid-template-columns: 32px minmax(200px, 3fr) 130px 100px 90px;
  align-items: center;
  gap: 8px;
}

.list-header {
  font-weight: 600;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 6px;
  margin-bottom: 6px;
  color: #606060;
  font-size: 13px;
}

.list-header > div {
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item {
  padding: 6px 4px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 13px;
}

.item:hover:not(.selected) {
  background: #f0f0f0;
}

.item.selected {
  background: #cce8ff;
  border-color: #99d1ff;
}

.item.cut {
  opacity: 0.5;
}

.item-icon {
  text-align: center;
  font-size: 16px;
}

.item-name,
.item-name-input-wrap,
.item-mtime,
.item-type,
.item-size {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-name-input-wrap input {
  width: 100%;
  border: 1px solid #0078d7;
  padding: 2px 4px;
  outline: none;
  border-radius: 2px;
  font-size: 13px;
}

.main-content.icons {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-content: flex-start;
}

.main-content.icons .item {
  width: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px;
  word-break: break-all;
}

.main-content.icons .item .item-icon {
  font-size: 32px;
  margin-bottom: 4px;
}

.main-content.icons .item .item-name {
  font-size: 12px;
  line-height: 1.2;
  max-height: 2.4em;
  overflow: hidden;
}
</style>
