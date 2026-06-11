<template>
  <div class="win11-explorer" tabindex="-1" @click="handleGlobalClick">
    <AddressBar
      ref="addressBarRef"
      :current-path="currentPath"
      :path-segments="pathSegments"
      :is-editing-path="isEditingPath"
      :path-input="pathInput"
      :can-go-back="explorerStore.canGoBack.value"
      :can-go-forward="explorerStore.canGoForward.value"
      @navigate-to="navigateTo"
      @navigate-to-segment="navigateToSegment"
      @go-up="goUp"
      @go-back="goBack"
      @go-forward="goForward"
      @start-editing-path="startEditingPath"
      @submit-path="submitPath"
      @force-refresh="forceRefresh"
      @update:path-input="updatePathInput"
      @search-change="(val) => (searchQuery = val)"
    />

    <CommandBar
      :selected-item="firstSelectedItem"
      :clipboard="clipboard"
      :new-menu-visible="newMenuVisible"
      :sort-label="sortLabel"
      :view-mode="viewMode"
      :selected-item-meta="selectedItemMeta"
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

    <div class="main-body">
      <Sidebar :current-path="currentPath" @navigate-to="navigateTo" />

      <MainContent
        ref="mainContentRef"
        :current-path="currentPath"
        :clipboard="clipboard"
        :displayed-contents="displayedContents"
        :selected-items="selectedItems"
        :view-mode="viewMode"
        :sort-field="sortField"
        :sort-desc="sortDesc"
        :search-query="searchQuery"
        @select-item="selectItem"
        @clear-selection="clearSelection"
        @handle-item-open="handleItemOpen"
        @open-item-context-menu="openItemContextMenu"
        @open-blank-context-menu="openBlankContextMenu"
        @change-sort="changeSort"
        @navigate-to="navigateTo"
        @handle-rename-selected="handleRenameSelected"
        @handle-move-items="handleMoveItems"
      />
    </div>

    <StatusBar
      :displayed-contents="displayedContents"
      :selected-item="firstSelectedItem"
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
import Sidebar from './Sidebar.vue'
import { useFileSystem } from '@/composables/useFileSystem'
import type { FileMetadata } from '@/services/fs'
import { createExplorerStore } from '../store/index'

// 初始化局部 Store
const explorerStore = createExplorerStore()

const { readDirectory, writeFile, readFile, createDirectory, deleteFile, renameFile, getMetadata } =
  useFileSystem()

const currentPath = explorerStore.currentPath
const pathSegments = explorerStore.pathSegments

const refreshKey = ref(0)
const forceRefresh = () => refreshKey.value++

// === 引用 ===
const addressBarRef = ref<any>(null)
const mainContentRef = ref<any>(null)

// === 地址栏编辑 ===
const isEditingPath = ref(false)
const pathInput = ref('')

const updatePathInput = (newValue: string) => {
  pathInput.value = newValue
}

const startEditingPath = async () => {
  isEditingPath.value = true
  pathInput.value = currentPath.value === '' ? '此电脑' : currentPath.value
  await nextTick()
  if (addressBarRef.value?.focusPathInput) addressBarRef.value.focusPathInput()
}

const submitPath = () => {
  isEditingPath.value = false
  let target = pathInput.value.trim().replace(/\\/g, '/').replace(/\/$/, '')
  if (target === '此电脑' || target.toLowerCase() === 'this pc') target = ''

  if (target === '' || getMetadata(target) || readDirectory(target).length >= 0) {
    navigateTo(target)
  } else {
    alert(`Windows 找不到路径 "${target}"。请检查拼写。`)
  }
}

// === 搜索与视图 ===
const searchQuery = ref('')
const sortField = ref<'name' | 'mtime' | 'size' | 'type'>('name')
const sortDesc = ref(false)
const viewMode = ref<'details' | 'icons'>('details')

const sortLabel = computed(() => {
  if (sortField.value === 'name') return '按名称'
  if (sortField.value === 'mtime') return '按日期'
  return '按大小'
})

// === 多选状态 ===
const selectedItems = ref<Set<string>>(new Set())
const lastSelectedIndex = ref<number>(-1)

// 从多选集合中取第一个，用于属性展示或单选特有操作（如重命名）
const firstSelectedItem = computed(() => {
  if (selectedItems.value.size === 0) return null
  return Array.from(selectedItems.value)[0]
})
const selectedItemMeta = computed(() =>
  firstSelectedItem.value ? getMetadata(firstSelectedItem.value) : null
)

// 获取当前目录过滤后的展示列表
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

// 多选处理逻辑
const selectItem = (payload: { path: string; ctrlKey: boolean; shiftKey: boolean }) => {
  const { path, ctrlKey, shiftKey } = payload
  const items = displayedContents.value
  const currentIndex = items.findIndex((i) => i.path === path)

  if (shiftKey && lastSelectedIndex.value !== -1) {
    selectedItems.value.clear()
    const start = Math.min(lastSelectedIndex.value, currentIndex)
    const end = Math.max(lastSelectedIndex.value, currentIndex)
    for (let i = start; i <= end; i++) selectedItems.value.add(items[i].path)
  } else if (ctrlKey) {
    if (selectedItems.value.has(path)) selectedItems.value.delete(path)
    else selectedItems.value.add(path)
    lastSelectedIndex.value = currentIndex
  } else {
    selectedItems.value.clear()
    selectedItems.value.add(path)
    lastSelectedIndex.value = currentIndex
  }
}

const clearSelection = () => {
  selectedItems.value.clear()
  lastSelectedIndex.value = -1
}

// === 菜单状态 ===
const contextMenu = ref({ visible: false, x: 0, y: 0, targetItem: null as FileMetadata | null })
const newMenuVisible = ref(false)

const toggleNewMenu = () => {
  newMenuVisible.value = !newMenuVisible.value
  contextMenu.value.visible = false
}

const handleGlobalClick = () => {
  contextMenu.value.visible = false
  newMenuVisible.value = false
  // 仅当点击了组件的最外层时清空选择（组件内部事件已被 stop 拦截）
}

const openItemContextMenu = (e: MouseEvent, item: FileMetadata) => {
  // 如果当前点击的项不在多选列表中，则单选该项；否则保持多选状态并拉起菜单
  if (!selectedItems.value.has(item.path)) {
    selectItem({ path: item.path, ctrlKey: false, shiftKey: false })
  }
  newMenuVisible.value = false
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, targetItem: item }
}

const openBlankContextMenu = (e: MouseEvent) => {
  clearSelection()
  newMenuVisible.value = false
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, targetItem: null }
}
const closeContextMenu = () => {
  contextMenu.value.visible = false
}

// === 导航方法 ===
const navigateTo = (path: string) => {
  if (currentPath.value === path) return
  explorerStore.pushPath(path)
  clearSelection()
  searchQuery.value = ''
}
const goBack = () => {
  explorerStore.goBack()
  clearSelection()
}
const goForward = () => {
  explorerStore.goForward()
  clearSelection()
}
const goUp = () => {
  if (currentPath.value === '') return
  const parts = currentPath.value.split('/')
  parts.pop()
  navigateTo(parts.join('/'))
}
const navigateToSegment = (index: number) => {
  const pathParts = [...pathSegments.value]
  if (currentPath.value === '') navigateTo(pathParts[index] || '')
  else navigateTo(pathParts.slice(0, index + 1).join('/'))
}

// === UI 交互辅助 ===
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

// === 智能防重名 ===
const getUniqueName = (baseName: string, ext: string = '') => {
  let name = ext ? `${baseName}${ext}` : baseName
  let counter = 1
  let testPath = currentPath.value === '' ? name : `${currentPath.value}/${name}`

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

// === 剪贴板真实业务逻辑 (支持数组) ===
const clipboard = ref<{ type: 'copy' | 'cut'; paths: string[] } | null>(null)

const handleCut = () => {
  if (selectedItems.value.size) {
    clipboard.value = { type: 'cut', paths: Array.from(selectedItems.value) }
    contextMenu.value.visible = false
  }
}
const handleCopy = () => {
  if (selectedItems.value.size) {
    clipboard.value = { type: 'copy', paths: Array.from(selectedItems.value) }
    contextMenu.value.visible = false
  }
}
const handlePaste = async () => {
  contextMenu.value.visible = false
  if (!clipboard.value) return
  const { type, paths } = clipboard.value

  for (const srcPath of paths) {
    let fileName = srcPath.split('/').pop() || '未命名'
    let targetPath = currentPath.value === '' ? fileName : `${currentPath.value}/${fileName}`

    // 处理防重名（当在同目录下复制时）
    if (getMetadata(targetPath) && type === 'copy') {
      const parts = fileName.split('.')
      const ext = parts.length > 1 ? `.${parts.pop()}` : ''
      fileName = `${parts.join('.')} - 副本${ext}`
      targetPath = currentPath.value === '' ? fileName : `${currentPath.value}/${fileName}`
    }

    if (type === 'cut') {
      await renameFile(srcPath, targetPath)
    } else {
      const meta = getMetadata(srcPath)
      if (meta?.type === 'file') {
        const content = await readFile(srcPath)
        if (content !== null) writeFile(targetPath, content)
      }
    }
  }

  if (type === 'cut') clipboard.value = null
  forceRefresh()
}

// === 拖拽移动 ===
const handleMoveItems = async (sourcePaths: string[], targetDir: string) => {
  for (const src of sourcePaths) {
    const fileName = src.split('/').pop()
    await renameFile(src, `${targetDir}/${fileName}`)
  }
  clearSelection()
  forceRefresh()
}

// === 其它原生级操作 ===
const handleShare = async () => {
  if (!firstSelectedItem.value) return
  try {
    await navigator.share({
      title: '分享文件',
      text: `分享 ${selectedItems.value.size} 个项目`,
      url: window.location.href
    })
  } catch (err) {
    alert(`系统不支持 Share API，或分享失败。`)
  }
}
const showProperties = (item: FileMetadata | null) => {
  if (!item) return
  contextMenu.value.visible = false
  alert(`名称：${item.name}\n位置：${item.path}\n大小：${item.size} bytes`)
}
const handleDeleteSelected = () => {
  contextMenu.value.visible = false
  if (selectedItems.value.size && confirm(`确定要永久删除这 ${selectedItems.value.size} 项吗？`)) {
    selectedItems.value.forEach((path) => deleteFile(path))
    clearSelection()
    forceRefresh()
  }
}

// 重命名逻辑 (结合 MainContent 内联方法)
const handleRenameSelected = (newName?: string | Event) => {
  contextMenu.value.visible = false
  if (selectedItems.value.size !== 1) return // 只能对单个文件重命名

  const targetPath = firstSelectedItem.value!

  if (typeof newName === 'string' && newName.trim()) {
    // 收到子组件提交的真实改名
    const oldName = targetPath.split('/').pop() || ''
    const finalName = newName.trim()
    if (finalName && finalName !== oldName) {
      const basePath = currentPath.value === '' ? '' : currentPath.value + '/'
      renameFile(targetPath, basePath + finalName)
      clearSelection()
      selectItem({ path: basePath + finalName, ctrlKey: false, shiftKey: false })
      forceRefresh()
    }
  } else {
    // 拉起内联输入框
    if (mainContentRef.value) {
      mainContentRef.value.startRename(targetPath)
    }
  }
}

// === 全局快捷键系统 ===
const handleKeyDown = (e: KeyboardEvent) => {
  // 当用户在地址栏或重命名输入框中打字时，不触发全局快捷键
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'c':
        handleCopy()
        break
      case 'x':
        handleCut()
        break
      case 'v':
        handlePaste()
        break
      case 'a':
        e.preventDefault()
        selectedItems.value = new Set(displayedContents.value.map((i) => i.path))
        break
    }
  } else {
    switch (e.key) {
      case 'Delete':
        handleDeleteSelected()
        break
      case 'F2':
        handleRenameSelected()
        break
      case 'Backspace':
        e.preventDefault()
        goUp()
        break
      case 'Enter':
        if (selectedItems.value.size === 1) {
          const meta = getMetadata(firstSelectedItem.value!)
          if (meta) handleItemOpen(meta)
        }
        break
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.win11-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--win-bg, #ffffff);
  color: var(--win-text, #202020);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  user-select: none; /* 防止多选时选中文本 */
  outline: none; /* 去除获取焦点时的边框 */
}

.main-body {
  display: flex;
  flex: 1;
  overflow: hidden; /* 防止溢出 */
}
/* 如果你的系统有暗黑模式 CSS 变量，可以在此处增加 */
</style>
