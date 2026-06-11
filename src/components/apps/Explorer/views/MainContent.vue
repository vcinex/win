<template>
  <div class="main-content">
    <Sidebar :current-path="currentPath" @navigate-to="navigateTo" />

    <div class="file-view" @contextmenu.prevent="openBlankContextMenu">
      <table v-if="viewMode === 'details'" class="file-table">
        <thead>
          <tr>
            <th class="col-name" @click="changeSort('name')">
              名称 {{ sortField === 'name' ? (sortDesc ? '↓' : '↑') : '' }}
            </th>
            <th class="col-date" @click="changeSort('mtime')">
              修改日期 {{ sortField === 'mtime' ? (sortDesc ? '↓' : '↑') : '' }}
            </th>
            <th class="col-type" @click="changeSort('type')">
              类型 {{ sortField === 'type' ? (sortDesc ? '↓' : '↑') : '' }}
            </th>
            <th class="col-size" @click="changeSort('size')">
              大小 {{ sortField === 'size' ? (sortDesc ? '↓' : '↑') : '' }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in displayedContents"
            :key="item.path"
            class="file-row"
            :class="{
              selected: selectedItem === item.path,
              'cut-pending': clipboard?.type === 'cut' && clipboard.path === item.path
            }"
            @click.stop="selectItem(item.path)"
            @dblclick.stop="handleItemOpen(item)"
            @contextmenu.prevent.stop="openItemContextMenu($event, item)"
          >
            <td>
              <span class="file-icon">{{ getIcon(item) }}</span>

              <!-- 重命名输入框（替换文件名） -->
              <div v-if="renamingItem === item.path" class="rename-input-container">
                <input
                  ref="detailInputList"
                  v-model="renameText"
                  class="rename-input"
                  @blur="commitRename"
                  @keyup.enter="commitRename"
                  @keyup.esc="cancelRename"
                />
              </div>
              <span v-else class="file-name">{{ item.name }}</span>
            </td>
            <td>{{ formatDate(item.mtime) }}</td>
            <td>{{ getTypeName(item) }}</td>
            <td>{{ item.type === 'directory' ? '' : formatSize(item.size) }}</td>
          </tr>
          <tr v-if="displayedContents.length === 0">
            <td colspan="4" class="empty-state">
              <span class="empty-icon">{{ searchQuery ? '🔍' : '📁' }}</span>
              <p>{{ searchQuery ? '没有找到符合条件的项目。' : '此文件夹为空。' }}</p>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="icon-view-container">
        <div
          v-for="item in displayedContents"
          :key="item.path"
          class="icon-item"
          :class="{
            selected: selectedItem === item.path,
            'cut-pending': clipboard?.type === 'cut' && clipboard.path === item.path
          }"
          @click.stop="selectItem(item.path)"
          @dblclick.stop="handleItemOpen(item)"
          @contextmenu.prevent.stop="openItemContextMenu($event, item)"
        >
          <!-- 图标视图重命名 -->
          <div class="large-icon">{{ getIcon(item) }}</div>
          <div class="icon-name-wrapper">
            <input
              v-if="renamingItem === item.path"
              ref="detailInputList"
              v-model="renameText"
              class="rename-input icon-rename-input"
              @blur="commitRename"
              @keyup.enter="commitRename"
              @keyup.esc="cancelRename"
            />
            <span v-else class="icon-name" :title="item.name">{{ item.name }}</span>
          </div>
        </div>
        <div v-if="displayedContents.length === 0" class="empty-state full-width">
          <span class="empty-icon">{{ searchQuery ? '🔍' : '📁' }}</span>
          <p>{{ searchQuery ? '没有找到符合条件的项目。' : '此文件夹为空。' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import Sidebar from './Sidebar.vue'
import type { FileMetadata } from '@/services/fs'

interface Props {
  currentPath: string
  displayedContents: FileMetadata[]
  selectedItem: string | null
  viewMode: 'details' | 'icons'
  sortField: 'name' | 'mtime' | 'size' | 'type'
  sortDesc: boolean
  searchQuery: string
  clipboard: { type: 'copy' | 'cut'; path: string; itemType: FileMetadata['type'] } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-item': [path: string]
  'handle-item-open': [item: FileMetadata]
  'open-item-context-menu': [e: MouseEvent, item: FileMetadata]
  'open-blank-context-menu': [e: MouseEvent]
  'change-sort': [field: 'name' | 'mtime' | 'size' | 'type']
  'navigate-to': [path: string]
  'handle-rename-selected': [newName: string]
}>()

// ==================== 重命名核心状态 ====================
const renamingItem = ref<string | null>(null)
const renameText = ref('')
// 存储单个输入框实例，不再是数组
const detailInputList = ref<HTMLInputElement[]>([])
const iconInputList = ref<HTMLInputElement[]>([])

// F2 触发重命名（Windows 标准）
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'F2' && props.selectedItem && !renamingItem.value) {
    startRename(props.selectedItem)
  }
}
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

// 启动重命名
const startRename = async (path: string) => {
  const item = props.displayedContents.find((i) => i.path === path)
  if (!item) return

  renamingItem.value = path
  renameText.value = item.name

  // 等待DOM渲染、ref数组填充完成
  await nextTick()
  await nextTick() // 双重nextTick，确保v-if渲染完毕

  let input: HTMLInputElement | null = null
  if (props.viewMode === 'details') {
    // 数组第一位就是当前激活的输入框
    input = detailInputList.value?.[0] ?? null
  } else {
    input = iconInputList.value?.[0] ?? null
  }

  // 多重安全校验
  if (!input || !(input instanceof HTMLInputElement)) {
    console.warn('重命名输入框获取失败')
    return
  }

  input.focus()
  const dotIndex = item.name.lastIndexOf('.')

  if (item.type === 'file' && dotIndex > 0) {
    input.setSelectionRange(0, dotIndex)
  } else {
    input.select()
  }
}

// 提交重命名
const commitRename = () => {
  const path = renamingItem.value
  const newName = renameText.value.trim()
  if (!path || !newName || newName === '') {
    cancelRename()
    return
  }

  emit('handle-rename-selected', newName)
  renamingItem.value = null
}

// 取消重命名
const cancelRename = () => {
  renamingItem.value = null
}

const selectItem = (path: string) => {
  emit('select-item', path)
}

const handleItemOpen = (item: FileMetadata) => {
  emit('handle-item-open', item)
}

const openItemContextMenu = (e: MouseEvent, item: FileMetadata) => {
  emit('open-item-context-menu', e, item)
}

const openBlankContextMenu = (e: MouseEvent) => {
  emit('open-blank-context-menu', e)
}

const changeSort = (field: 'name' | 'mtime' | 'size' | 'type') => {
  emit('change-sort', field)
}

const navigateTo = (path: string) => {
  emit('navigate-to', path)
}

// 以下是修复的问题：将函数从 props 移到组件内部
const getIcon = (item: FileMetadata): string => {
  if (item.type === 'directory') return item.path.includes('/') ? '📁' : '💾'
  const ext = item.name.split('.').pop()?.toLowerCase()
  if (ext === 'txt') return '📝'
  if (ext === 'md') return '📓'
  if (ext === 'png' || ext === 'jpg') return '🖼️'
  return '📄'
}

const getTypeName = (item: FileMetadata): string => {
  if (item.type === 'directory') return item.path.includes('/') ? '文件夹' : '本地磁盘'
  const ext = item.name.split('.').pop()?.toLowerCase()
  if (ext === 'txt') return '文本文档'
  if (ext === 'png') return 'PNG 图像'
  return '文件'
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 KB'
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB'][i]
}

const formatDate = (ts: number): string => {
  const d = new Date(ts)
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  background-color: #ffffff;
}

/* 4. 文件列表区 */
.file-view {
  flex: 1;
  overflow-y: auto;
  background-color: #ffffff;
  padding: 4px;
}

/* 列表视图 */
.file-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.file-table th {
  padding: 8px 12px;
  font-weight: 400;
  color: #555;
  position: sticky;
  top: 0;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  user-select: none;
}

.file-table th:hover {
  background-color: #f9f9f9;
}

.file-row {
  border-bottom: 1px solid transparent;
  border-radius: 4px;
}

.file-row:hover {
  background-color: #f6f6f6;
}

.file-row.selected {
  background-color: #e8f0f4;
}

.file-row.cut-pending {
  opacity: 0.5;
}

.file-row td {
  padding: 6px 12px;
  white-space: nowrap;
}

.file-icon {
  font-size: 18px;
  margin-right: 8px;
  vertical-align: middle;
}

.file-name {
  vertical-align: middle;
}

.col-name {
  width: 45%;
}

.col-date {
  width: 25%;
}

.col-type {
  width: 15%;
}

.col-size {
  width: 15%;
}

/* 图标视图 */
.icon-view-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  padding: 12px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  text-align: center;
}

.icon-item:hover {
  background-color: #f6f6f6;
}

.icon-item.selected {
  background-color: #e8f0f4;
  border-color: #d2e4f0;
}

.icon-item.cut-pending {
  opacity: 0.5;
}

.large-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.icon-name {
  font-size: 12px;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px !important;
  color: #888;
}

.full-width {
  grid-column: 1 / -1;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.6;
  display: block;
  margin-bottom: 12px;
}

.rename-input-container {
  display: inline-block;
  position: relative;
  vertical-align: middle;
}

.rename-input {
  font-size: 13px;
  padding: 2px 6px;
  border: 1px solid #0078d4;
  outline: none;
  min-width: 120px;
  background: #fff;
}

.icon-rename-input {
  width: 80px;
  text-align: center;
  font-size: 12px;
  padding: 1px 4px;
}
</style>
