<template>
  <div class="win11-explorer" @click="handleGlobalClick">
    <AddressBar
      ref="addressBarRef"
      :current-path="currentPath"
      :path-segments="pathSegments"
      :is-editing-path="isEditingPath"
      :path-input="pathInput"
      :can-go-back="historyIndex > 0"
      :can-go-forward="historyIndex < history.length - 1"
      @navigate-to="navigateTo"
      @navigate-to-segment="navigateToSegment"
      @go-up="goUp"
      @go-back="goBack"
      @go-forward="goForward"
      @start-editing-path="startEditingPath"
      @submit-path="submitPath"
      @force-refresh="forceRefresh"
      @update:path-input="updatePathInput"
    />

    <CommandBar
      :selected-item="selectedItem"
      :clipboard="clipboard"
      :new-menu-visible="newMenuVisible"
      :sort-label="sortLabel"
      :view-mode="viewMode"
      :selected-item-meta="null"
      @handle-new-file="handleNewFile"
      @handle-new-folder="handleNewFolder"
      @toggle-new-menu="toggleNewMenu"
      @handle-cut="handleCut"
      @handle-copy="handleCopy"
      @handle-paste="handlePaste"
      @handle-rename-selected="handleRenameSelected"
      @handle-share="handleShare"
      @handle-delete-selected="handleDeleteSelected"
      @toggle-sort="toggleSort"
      @toggle-view-mode="toggleViewMode"
      @close-new-menu="newMenuVisible = false"
    />

    <MainContent
      :current-path="currentPath"
      :clipboard="clipboard"
      :displayed-contents="displayedContents"
      :selected-item="selectedItem"
      :view-mode="viewMode"
      :sort-field="sortField"
      :sort-desc="sortDesc"
      :search-query="searchQuery"
      @select-item="selectItem"
      @handle-item-open="handleItemOpen"
      @open-item-context-menu="openItemContextMenu"
      @open-blank-context-menu="openBlankContextMenu"
      @change-sort="changeSort"
      @navigate-to="navigateTo"
      @handle-rename-selected="handleRenameSelected"
    />

    <StatusBar
      :displayed-contents="displayedContents"
      :selected-item="selectedItem"
      :view-mode="viewMode"
      @set-view-mode="setViewMode"
    />

    <ContextMenu
      :clipboard="clipboard"
      :context-menu="contextMenu"
      :selected-item-meta="selectedItemMeta"
      @handle-item-open="handleItemOpen"
      @handle-cut="handleCut"
      @handle-copy="handleCopy"
      @handle-rename-selected="handleRenameSelected"
      @handle-delete-selected="handleDeleteSelected"
      @show-properties="showProperties"
      @handle-paste="handlePaste"
      @handle-new-folder="handleNewFolder"
      @handle-new-file="handleNewFile"
      @close-context-menu="closeContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import AddressBar from './AddressBar.vue'
import CommandBar from './CommandBar.vue'
import MainContent from './MainContent.vue'
import StatusBar from './StatusBar.vue'
import ContextMenu from './ContextMenu.vue'
import { useFileSystem } from '@/composables/useFileSystem'
import type { FileMetadata } from '@/services/fs'
import { useExplorerStore } from '../store/index'
const explorerStore = useExplorerStore()

const { readDirectory, writeFile, readFile, createDirectory, deleteFile, renameFile, getMetadata } =
  useFileSystem()

// 导航状态
// const history = ref<string[]>(['C:/Users/Admin'])
// const historyIndex = ref(0)
const currentPath = computed(() => explorerStore.history[explorerStore.historyIndex] ?? '')
const pathSegments = computed(() =>
  currentPath.value ? currentPath.value.split('/').filter((s) => s) : []
)

// 强制刷新 Key
const refreshKey = ref(0)
const forceRefresh = () => {
  refreshKey.value++
}

// === 修复：地址栏点击编辑功能 ===
const isEditingPath = ref(false)
const pathInput = ref('')
const addressBarRef = ref<any>(null)

const updatePathInput = (newValue: string) => {
  pathInput.value = newValue
}

const startEditingPath = async () => {
  isEditingPath.value = true
  pathInput.value = currentPath.value === '' ? '此电脑' : currentPath.value
  await nextTick()
  // 如果 AddressBar 有聚焦方法，可以调用
  if (addressBarRef.value && addressBarRef.value.focusPathInput) {
    addressBarRef.value.focusPathInput()
  }
}

const submitPath = () => {
  isEditingPath.value = false
  // 兼容反斜杠和末尾多余的斜杠
  let target = pathInput.value.trim().replace(/\\/g, '/').replace(/\/$/, '')
  if (target === '此电脑' || target.toLowerCase() === 'this pc') target = ''

  // 验证路径合法性（是根目录，或者在元数据中存在，或者能读出子项）
  if (target === '' || getMetadata(target) || readDirectory(target).length >= 0) {
    navigateTo(target)
  } else {
    alert(`Windows 找不到路径 "${target}"。请检查拼写。`)
  }
}

// === 搜索、排序、视图状态 ===
const searchQuery = ref('')
const sortField = ref<'name' | 'mtime' | 'size' | 'type'>('name')
const sortDesc = ref(false)
const viewMode = ref<'details' | 'icons'>('details')

const sortLabel = computed(() => {
  if (sortField.value === 'name') return '按名称'
  if (sortField.value === 'mtime') return '按日期'
  return '按大小'
})

// === 剪贴板状态 ===
const clipboard = ref<{
  type: 'copy' | 'cut'
  path: string
  itemType: FileMetadata['type']
} | null>(null)

const displayedContents = computed(() => {
  let list = readDirectory(currentPath.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((item) => item.name.toLowerCase().includes(q))
  }
  list.sort((a, b) => {
    let res = 0
    if (sortField.value === 'name') res = a.name.localeCompare(b.name)
    else if (sortField.value === 'mtime') res = a.mtime - b.mtime
    else if (sortField.value === 'size') res = a.size - b.size
    else if (sortField.value === 'type') res = a.type.localeCompare(b.type)
    if (sortField.value !== 'type' && a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return sortDesc.value ? -res : res
  })
  return list
})

// === 菜单与选中状态 ===
const selectedItem = ref<string | null>(null)
const selectedItemMeta = computed(() =>
  selectedItem.value ? getMetadata(selectedItem.value) : null
)

const contextMenu = ref({ visible: false, x: 0, y: 0, targetItem: null as FileMetadata | null })
const newMenuVisible = ref(false)

const toggleNewMenu = () => {
  newMenuVisible.value = !newMenuVisible.value
  contextMenu.value.visible = false
}

// 全局点击清空状态
const handleGlobalClick = () => {
  contextMenu.value.visible = false
  newMenuVisible.value = false
  clearSelection()
}

onMounted(() => window.addEventListener('click', handleGlobalClick))
onUnmounted(() => window.removeEventListener('click', handleGlobalClick))

const openItemContextMenu = (e: MouseEvent, item: FileMetadata) => {
  selectItem(item.path)
  newMenuVisible.value = false
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, targetItem: item }
}

const openBlankContextMenu = (e: MouseEvent) => {
  clearSelection()
  newMenuVisible.value = false
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, targetItem: null }
}

// === 导航方法 ===
const navigateTo = (path: string) => {
  if (currentPath.value === path) return
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(path)
  historyIndex.value++
  clearSelection()
  searchQuery.value = ''
}
const goBack = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    clearSelection()
  }
}
const goForward = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    clearSelection()
  }
}
const goUp = () => {
  if (currentPath.value === '') return
  const parts = currentPath.value.split('/')
  parts.pop()
  navigateTo(parts.join('/'))
}
const navigateToSegment = (index: number) => {
  const pathParts = [...pathSegments.value]
  if (currentPath.value === '') {
    // 如果当前路径为空（显示"此电脑"），则直接导航到第一个段
    navigateTo(pathParts[index] || '')
  } else {
    navigateTo(pathParts.slice(0, index + 1).join('/'))
  }
}

// === UI 交互 ===
const selectItem = (path: string) => {
  selectedItem.value = path
}
const clearSelection = () => {
  selectedItem.value = null
}
const changeSort = (field: 'name' | 'mtime' | 'size' | 'type') => {
  if (sortField.value === field) sortDesc.value = !sortDesc.value
  else {
    sortField.value = field
    sortDesc.value = false
  }
}
const toggleSort = () => {
  const fields: ('name' | 'mtime' | 'size')[] = ['name', 'mtime', 'size']
  const idx = fields.indexOf(sortField.value as any)
  changeSort(fields[(idx + 1) % fields.length])
}
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'details' ? 'icons' : 'details'
}
const setViewMode = (mode: 'details' | 'icons') => {
  viewMode.value = mode
}

const handleItemOpen = (item: FileMetadata) => {
  contextMenu.value.visible = false
  if (item.type === 'directory') navigateTo(item.path)
  else
    window.dispatchEvent(
      new CustomEvent('vfs-open-file', { detail: { appId: 'text-editor', filePath: item.path } })
    )
}

// === 修复：智能防重名的方法 ===
const getUniqueName = (baseName: string, ext: string = '') => {
  let name = ext ? `${baseName}${ext}` : baseName
  let counter = 1
  let testPath = currentPath.value === '' ? name : `${currentPath.value}/${name}`

  // 如果遇到重名文件，自动追加 (2), (3)...
  while (getMetadata(testPath)) {
    counter++
    name = ext ? `${baseName} (${counter})${ext}` : `${baseName} (${counter})`
    testPath = currentPath.value === '' ? name : `${currentPath.value}/${name}`
  }
  return name
}

const handleNewFolder = () => {
  contextMenu.value.visible = false
  newMenuVisible.value = false
  const defaultName = getUniqueName('新建文件夹')
  const name = prompt('新建文件夹名称:', defaultName)
  if (name) {
    createDirectory(currentPath.value === '' ? name : `${currentPath.value}/${name}`)
    forceRefresh()
  }
}

const handleNewFile = () => {
  contextMenu.value.visible = false
  newMenuVisible.value = false
  const defaultName = getUniqueName('新建文本文档', '.txt')
  const name = prompt('新建文档名称:', defaultName)
  if (name) {
    writeFile(currentPath.value === '' ? name : `${currentPath.value}/${name}`, '')
    forceRefresh()
  }
}

// === 剪贴板真实业务逻辑 ===
const handleCut = () => {
  if (!selectedItemMeta.value) return
  clipboard.value = {
    type: 'cut',
    path: selectedItemMeta.value.path,
    itemType: selectedItemMeta.value.type
  }
}
const handleCopy = () => {
  if (!selectedItemMeta.value) return
  clipboard.value = {
    type: 'copy',
    path: selectedItemMeta.value.path,
    itemType: selectedItemMeta.value.type
  }
}
const handlePaste = async () => {
  if (!clipboard.value) return
  const { type, path, itemType } = clipboard.value
  let fileName = path.split('/').pop() || '未命名'

  let targetPath = currentPath.value === '' ? fileName : `${currentPath.value}/${fileName}`
  if (getMetadata(targetPath) && type === 'copy') {
    const parts = fileName.split('.')
    const ext = parts.length > 1 ? `.${parts.pop()}` : ''
    fileName = `${parts.join('.')} - 副本${ext}`
    targetPath = currentPath.value === '' ? fileName : `${currentPath.value}/${fileName}`
  }

  if (type === 'cut') {
    if (await renameFile(path, targetPath)) clipboard.value = null
    else alert('移动失败：目标可能已存在。')
  } else {
    if (itemType === 'file') {
      const content = await readFile(path)
      if (content !== null) writeFile(targetPath, content)
    } else alert('虚拟系统暂不支持复制整个文件夹，请使用剪切或进入内部复制。')
  }
  forceRefresh()
}

// === 其它原生级操作 ===
const handleShare = async () => {
  if (!selectedItemMeta.value) return
  try {
    await navigator.share({
      title: selectedItemMeta.value.name,
      text: `分享文件: ${selectedItemMeta.value.name}`,
      url: window.location.href
    })
  } catch (err) {
    alert(
      `系统不支持 Share API：欲分享 [${selectedItemMeta.value.name}， ${err instanceof Error ? (err as Error).message : JSON.stringify(err)}]`
    )
  }
}
const showProperties = (item: FileMetadata | null) => {
  if (!item) return
  alert(
    `【文件属性】\n\n名称：${item.name}\n类型：${getTypeName(item)}\n位置：${item.path}\n大小：${formatSize(item.size)}\n修改时间：${formatDate(item.mtime)}`
  )
}
const handleDeleteSelected = () => {
  if (selectedItem.value && confirm(`确定要永久删除此项吗？`)) {
    deleteFile(selectedItem.value)
    if (clipboard.value?.path === selectedItem.value) clipboard.value = null
    selectedItem.value = null
    forceRefresh()
  }
}
const handleRenameSelected = (newName: string) => {
  if (!selectedItem.value) return
  const oldName = selectedItem.value.split('/').pop() || ''
  // const newName = prompt('重命名为:', oldName)
  if (newName && newName !== oldName) {
    const basePath = currentPath.value === '' ? '' : currentPath.value + '/'
    renameFile(selectedItem.value, basePath + newName)
    selectedItem.value = basePath + newName
    forceRefresh()
  }
}

// === 辅助格式化 ===
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getIcon = (item: FileMetadata) => {
  if (item.type === 'directory') return item.path.includes('/') ? '📁' : '💾'
  const ext = item.name.split('.').pop()?.toLowerCase()
  if (ext === 'txt') return '📝'
  if (ext === 'md') return '📓'
  if (ext === 'png' || ext === 'jpg') return '🖼️'
  return '📄'
}
const getTypeName = (item: FileMetadata) => {
  if (item.type === 'directory') return item.path.includes('/') ? '文件夹' : '本地磁盘'
  const ext = item.name.split('.').pop()?.toLowerCase()
  if (ext === 'txt') return '文本文档'
  if (ext === 'png') return 'PNG 图像'
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
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// ContextMenu 方法
const closeContextMenu = () => {
  contextMenu.value.visible = false
}
</script>

<style scoped>
/* 全局基础与配色 */
.win11-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
  background-color: #f3f3f3;
  color: #1a1a1a;
  user-select: none;
  position: relative;
}
</style>
