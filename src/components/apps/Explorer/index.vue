<template>
  <div class="explorer-window" @click="clearSelection">
    <div class="toolbar">
      <button class="tool-btn" @click.stop="handleNewFolder"><span class="icon">📁</span> 新建文件夹</button>
      <button class="tool-btn" @click.stop="handleNewFile"><span class="icon">📄</span> 新建文档</button>
      <button class="tool-btn" :disabled="!selectedItem" @click.stop="handleDeleteSelected">
        <span class="icon">🗑️</span> 删除
      </button>
    </div>

    <div class="address-bar-container">
      <div class="nav-buttons">
        <button :disabled="historyIndex <= 0" @click="goBack">←</button>
        <button :disabled="historyIndex >= history.length - 1" @click="goForward">→</button>
        <button :disabled="currentPath === ''" @click="goUp">↑</button>
      </div>
      <div class="address-bar">
        <span class="icon">{{ currentPath === '' ? '💻' : '📁' }}</span>
        <div class="breadcrumbs">
          <span class="crumb-item" @click.stop="navigateTo('')">此电脑</span>
          <span v-for="(segment, index) in pathSegments" :key="index" class="crumb-wrapper">
            <span class="separator">›</span>
            <span class="crumb-item" @click.stop="navigateToSegment(index)">{{ segment }}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="sidebar">
        <ul class="nav-tree">
          <li class="nav-item" :class="{ active: currentPath === '' }" @click="navigateTo('')"><span class="icon">💻</span> 此电脑</li>
          <li class="nav-item" :class="{ active: currentPath === 'C:' }" @click="navigateTo('C:')"><span class="icon">💽</span> 本地磁盘 (C:)</li>
          <li class="nav-item" :class="{ active: currentPath === 'C:/Users/Admin/Desktop' }" @click="navigateTo('C:/Users/Admin/Desktop')"><span class="icon">🖥️</span> 桌面</li>
          <li class="nav-item" :class="{ active: currentPath === 'C:/Users/Admin/Documents' }" @click="navigateTo('C:/Users/Admin/Documents')"><span class="icon">📂</span> 文档</li>
        </ul>
      </div>

      <div class="file-view" @contextmenu.prevent="openBlankContextMenu">
        <table class="file-table">
          <thead>
            <tr>
              <th class="col-name">名称</th>
              <th class="col-date">修改日期</th>
              <th class="col-type">类型</th>
              <th class="col-size">大小</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in currentContents" 
              :key="item.path" 
              class="file-row"
              :class="{ 'selected': selectedItem === item.path }"
              @click.stop="selectItem(item.path)"
              @dblclick.stop="handleItemOpen(item)"
              @contextmenu.prevent.stop="openItemContextMenu($event, item)"
            >
              <td>
                <span class="file-icon">{{ getIcon(item) }}</span>
                {{ item.name }}
              </td>
              <td>{{ formatDate(item.mtime) }}</td>
              <td>{{ getTypeName(item) }}</td>
              <td>{{ item.type === 'directory' ? '' : formatSize(item.size) }}</td>
            </tr>
            <tr v-if="currentContents.length === 0">
              <td colspan="4" class="empty-state">此文件夹为空</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div 
      v-if="contextMenu.visible" 
      class="context-menu" 
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <template v-if="contextMenu.targetItem">
        <div class="menu-item" @click="handleItemOpen(contextMenu.targetItem)">打开</div>
        <div class="menu-separator"></div>
        <div class="menu-item" @click="handleRenameSelected">重命名</div>
        <div class="menu-item text-danger" @click="handleDeleteSelected">删除</div>
      </template>
      <template v-else>
        <div class="menu-item" @click="handleNewFolder">新建文件夹</div>
        <div class="menu-item" @click="handleNewFile">新建文本文档</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFileSystem } from '@/composables/useFileSystem'
import type { FileMetadata } from '@/services/fs'

const { readDirectory, writeFile, createDirectory, deleteFile, renameFile } = useFileSystem()

// 导航状态
const history = ref<string[]>(['C:/Users/Admin'])
const historyIndex = ref(0)
const currentPath = computed(() => history.value[historyIndex.value] ?? '')
const pathSegments = computed(() => currentPath.value ? currentPath.value.split('/') : [])

// 由于 useFileSystem 是响应式的单例，计算属性会自动更新
const currentContents = computed(() => readDirectory(currentPath.value))

// 选中状态
const selectedItem = ref<string | null>(null)

// 右键菜单状态
const contextMenu = ref({ visible: false, x: 0, y: 0, targetItem: null as FileMetadata | null })

const closeContextMenu = () => { contextMenu.value.visible = false }

onMounted(() => window.addEventListener('click', closeContextMenu))
onUnmounted(() => window.removeEventListener('click', closeContextMenu))

const openItemContextMenu = (e: MouseEvent, item: FileMetadata) => {
  selectItem(item.path)
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, targetItem: item }
}

const openBlankContextMenu = (e: MouseEvent) => {
  clearSelection()
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, targetItem: null }
}

// 导航方法
const navigateTo = (path: string) => {
  if (currentPath.value === path) return
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(path)
  historyIndex.value++
  clearSelection()
}

const goBack = () => { if (historyIndex.value > 0) { historyIndex.value--; clearSelection() } }
const goForward = () => { if (historyIndex.value < history.value.length - 1) { historyIndex.value++; clearSelection() } }
const goUp = () => {
  if (currentPath.value === '') return
  const parts = currentPath.value.split('/')
  parts.pop()
  navigateTo(parts.join('/'))
}
const navigateToSegment = (index: number) => {
  navigateTo(pathSegments.value.slice(0, index + 1).join('/'))
}

// 交互操作
const selectItem = (path: string) => { selectedItem.value = path }
const clearSelection = () => { selectedItem.value = null }

const handleItemOpen = (item: FileMetadata) => {
  closeContextMenu()
  if (item.type === 'directory') {
    navigateTo(item.path)
  } else {
    // 触发全局事件供 DesktopShell 监听并拉起 TextEditor
    window.dispatchEvent(new CustomEvent('vfs-open-file', {
      detail: { appId: 'text-editor', filePath: item.path }
    }))
  }
}

const handleNewFolder = () => {
  closeContextMenu()
  const name = prompt('请输入新建文件夹名称:', '新建文件夹')
  if (name) createDirectory(currentPath.value === '' ? name : `${currentPath.value}/${name}`)
}

const handleNewFile = () => {
  closeContextMenu()
  const name = prompt('请输入新建文档名称:', '新建文本文档.txt')
  if (name) writeFile(currentPath.value === '' ? name : `${currentPath.value}/${name}`, '')
}

const handleDeleteSelected = () => {
  closeContextMenu()
  if (selectedItem.value && confirm(`确定要永久删除 ${selectedItem.value.split('/').pop()} 吗？`)) {
    deleteFile(selectedItem.value)
    selectedItem.value = null
  }
}

const handleRenameSelected = () => {
  closeContextMenu()
  if (!selectedItem.value) return
  const oldName = selectedItem.value.split('/').pop() || ''
  const newName = prompt('重命名为:', oldName)
  if (newName && newName !== oldName) {
    const basePath = currentPath.value === '' ? '' : currentPath.value + '/'
    renameFile(selectedItem.value, basePath + newName)
    selectedItem.value = basePath + newName
  }
}

// 辅助方法
const getIcon = (item: FileMetadata) => {
  if (item.type === 'directory') return item.path.includes('/') ? '📁' : '💽'
  const ext = item.name.split('.').pop()?.toLowerCase()
  if (ext === 'txt') return '📝'
  if (ext === 'png' || ext === 'jpg') return '🖼️'
  return '📄'
}

const getTypeName = (item: FileMetadata) => {
  if (item.type === 'directory') return item.path.includes('/') ? '文件夹' : '本地磁盘'
  const ext = item.name.split('.').pop()?.toLowerCase()
  if (ext === 'txt') return '文本文档'
  return '文件'
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 KB'
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB'][i]
}

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}
</script>

<style scoped>
.explorer-window { display: flex; flex-direction: column; height: 100%; font-family: 'Segoe UI', Tahoma, sans-serif; background: #fff; user-select: none; position: relative;}
.toolbar { display: flex; padding: 6px 12px; background: #f5f6f7; border-bottom: 1px solid #e1e1e1; gap: 4px; }
.tool-btn { display: flex; align-items: center; gap: 4px; padding: 5px 10px; background: transparent; border: 1px solid transparent; border-radius: 4px; cursor: pointer; font-size: 12px; }
.tool-btn:hover:not(:disabled) { background: #e5e5e5; }
.tool-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.address-bar-container { display: flex; padding: 6px 12px; border-bottom: 1px solid #e1e1e1; gap: 10px; align-items: center;}
.nav-buttons button { background: none; border: none; font-size: 16px; width: 28px; height: 28px; border-radius: 50%; cursor: pointer;}
.nav-buttons button:hover:not(:disabled) { background: #eee; }
.address-bar { flex: 1; display: flex; align-items: center; border: 1px solid #ccc; padding: 4px 8px; border-radius: 2px; }
.breadcrumbs { display: flex; margin-left: 8px; font-size: 12px; }
.crumb-item { padding: 2px 4px; cursor: pointer; }
.crumb-item:hover { background: #e5f3ff; }
.separator { margin: 0 4px; color: #999; }

.main-content { display: flex; flex: 1; overflow: hidden; }
.sidebar { width: 180px; background: #f0f0f0; border-right: 1px solid #e1e1e1; overflow-y: auto; }
.nav-item { padding: 8px 16px; display: flex; gap: 8px; font-size: 12px; cursor: pointer; }
.nav-item:hover { background: #e5e5e5; }
.nav-item.active { background: #cce8ff; font-weight: bold; }

.file-view { flex: 1; overflow-y: auto; background: #fff; }
.file-table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
.file-table th { padding: 6px 12px; border-right: 1px solid #eee; font-weight: normal; color: #555; position: sticky; top: 0; background: #fff; border-bottom: 1px solid #eee;}
.file-row { border-bottom: 1px solid transparent; }
.file-row:hover { background: #f2f9ff; }
.file-row.selected { background: #cce8ff; border-bottom: 1px solid #99d1ff; outline: 1px solid #99d1ff; outline-offset: -1px; }
.file-row td { padding: 6px 12px; white-space: nowrap; }
.file-icon { font-size: 16px; margin-right: 6px; vertical-align: middle; }
.col-name { width: 40%; }
.col-date { width: 25%; }
.col-type { width: 20%; }
.col-size { width: 15%; }

/* 右键菜单样式 */
.context-menu { position: absolute; background: #f9f9f9; border: 1px solid #ccc; box-shadow: 2px 2px 6px rgba(0,0,0,0.2); border-radius: 4px; padding: 4px 0; z-index: 1000; min-width: 150px; font-size: 12px;}
.menu-item { padding: 6px 24px; cursor: pointer; }
.menu-item:hover { background: #e5f3ff; }
.menu-separator { height: 1px; background: #ddd; margin: 4px 0; }
.text-danger { color: red; }
</style>