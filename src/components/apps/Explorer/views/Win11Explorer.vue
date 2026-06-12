<template>
  <div class="win11-explorer" tabindex="-1" @click="handleGlobalClick">
    <AddressBar
      :current-path="currentPath"
      :path-segments="pathSegments"
      :is-editing-path="isEditingPath"
      :path-input="pathInput"
      :can-go-back="canGoBack"
      :can-go-forward="canGoForward"
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

    <div v-if="isPickerMode" class="picker-footer">
      <div class="file-name-input">
        <label>文件名:</label>
        <input v-model="selectedFileName" type="text" disabled />
      </div>
      <div class="picker-actions">
        <button :disabled="!selectedFileName" @click="confirmPick">打开(O)</button>
        <button @click="cancelPick">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import AddressBar from './AddressBar.vue'
import CommandBar from './CommandBar.vue'
import Sidebar from './Sidebar.vue'
import MainContent from './MainContent.vue'
import StatusBar from './StatusBar.vue'
import { createExplorerStore } from '../store/index'
import { useFileSystem } from '@/composables/useFileSystem'
import { useSystemManager } from '@/composables/useSystemManager'
import { useContextMenu } from '@/composables/useContextMenu'
import { useDialog } from '@/composables/useDialog'

const props = defineProps<{
  pid?: string
  path?: string
  mode?: 'normal' | 'picker'
  onPick?: (path: string) => void
  onCancel?: () => void
}>()

const isPickerMode = computed(() => props.mode === 'picker')
const selectedFileName = ref('')

// 初始化服务与Store
const explorerStore = createExplorerStore()
const fs = useFileSystem()
const sys = useSystemManager()
const ctxMenu = useContextMenu()

// 映射 Store 状态
const currentPath = explorerStore.currentPath
const pathSegments = explorerStore.pathSegments
const canGoBack = explorerStore.canGoBack
const canGoForward = explorerStore.canGoForward
const goBack = explorerStore.goBack
const goForward = explorerStore.goForward
const pushPath = explorerStore.pushPath

// 核心业务状态
const isEditingPath = ref(false)
const pathInput = ref('')
const searchQuery = ref('')
const contents = ref<any[]>([])
const selectedItems = ref<Set<string>>(new Set())
const viewMode = ref('icons')
const sortField = ref('name')
const sortDesc = ref(false)
const newMenuVisible = ref(false)
const clipboard = ref<{ type: 'cut' | 'copy'; paths: string[] } | null>(null)

// 计算属性
const firstSelectedItem = computed(() =>
  selectedItems.value.size > 0 ? Array.from(selectedItems.value)[0] : null
)
const selectedItemMeta = computed(() => {
  if (!firstSelectedItem.value) return null
  return contents.value.find((c) => c.path === firstSelectedItem.value) || null
})

const sortLabel = computed(() => {
  const map: Record<string, string> = {
    name: '名称',
    mtime: '修改日期',
    size: '大小',
    type: '类型'
  }
  return map[sortField.value] || '名称'
})

const displayedContents = computed(() => {
  let list = [...contents.value]
  if (searchQuery.value) {
    list = list.filter((item) => item.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }
  list.sort((a, b) => {
    let res = 0
    if (sortField.value === 'name') res = a.name.localeCompare(b.name)
    else if (sortField.value === 'mtime') res = (a.mtime || 0) - (b.mtime || 0)
    else if (sortField.value === 'size') res = (a.size || 0) - (b.size || 0)
    else if (sortField.value === 'type') res = (a.type || '').localeCompare(b.type || '')
    return sortDesc.value ? -res : res
  })
  return list
})

// 读取文件系统数据
const fetchContents = async () => {
  if (currentPath.value) {
    try {
      // 适配 fs 的各种可能的读取方法名
      const readFn = (fs as any).readDir || (fs as any).readDirectory || (fs as any).list
      const res = await readFn(currentPath.value)
      contents.value = Array.isArray(res) ? res : []
    } catch (e) {
      console.warn('读取目录失败: ', e)
      contents.value = []
    }
  }
}

watch(
  currentPath,
  () => {
    selectedItems.value.clear()
    fetchContents()
  },
  { immediate: true }
)

onMounted(() => {
  if (props.path) pushPath(props.path)
})

const { showMessage } = useDialog()

// === 导航事件处理 ===
const navigateTo = (path: string) => pushPath(path)
const navigateToSegment = (index: number) => {
  const path = pathSegments.value.slice(0, index + 1).join('/')
  pushPath(path.startsWith('C:') ? path : 'C:/' + path)
}
const goUp = () => {
  if (currentPath.value === 'C:' || currentPath.value === 'C:/') return
  const parts = currentPath.value.split('/').filter(Boolean)
  parts.pop()
  pushPath(parts.join('/') || 'C:/')
}
const forceRefresh = () => fetchContents()
const startEditingPath = () => {
  isEditingPath.value = true
  pathInput.value = currentPath.value
}
const updatePathInput = (val: string) => {
  pathInput.value = val
}
const submitPath = () => {
  isEditingPath.value = false
  pushPath(pathInput.value)
}

// === 选择器处理 ===
const selectItem = (path: string, multi: boolean = false) => {
  if (!multi) selectedItems.value.clear()
  selectedItems.value.add(path)
}
const clearSelection = () => selectedItems.value.clear()
const handleGlobalClick = () => {
  newMenuVisible.value = false
}

// === 文件操作事件处理 ===
const handleItemOpen = (item: any) => {
  if (item.type === 'directory') {
    pushPath(item.path)
  } else if (isPickerMode.value) {
    selectedFileName.value = item.name
  } else {
    // 规范与健壮性：优先使用文件自带的 appId 关联，若无则根据后缀名推断，最后兜底使用 notepad
    const appId = item.appId || getAppIdByExtension(item.name) || 'notepad'
    sys.openApp(appId, { path: item.path })
  }
}

// 新增后缀名推断助手（便于后续扩展图片查看器、视频播放器等）
const getAppIdByExtension = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    txt: 'notepad',
    md: 'notepad',
    json: 'notepad'
    // png: 'photos', // 留作未来扩展
  }
  return ext ? map[ext] : 'notepad'
}

const toggleNewMenu = () => {
  newMenuVisible.value = !newMenuVisible.value
}

const handleNewFolder = async () => {
  newMenuVisible.value = false
  const name = prompt('请输入文件夹名称', '新建文件夹')

  if (!name) return
  const mkDirFn = (fs as any).createDirectory || (fs as any).mkdir
  if (mkDirFn) await mkDirFn(`${currentPath.value}/${name}`)
  fetchContents()
}

const handleNewFile = async () => {
  newMenuVisible.value = false
  const name = prompt('请输入文件名称', '新建文本文档.txt')
  if (!name) return
  if ((fs as any).writeFile) await (fs as any).writeFile(`${currentPath.value}/${name}`, '')
  fetchContents()
}

const handleCut = () => {
  clipboard.value = { type: 'cut', paths: Array.from(selectedItems.value) }
}
const handleCopy = () => {
  clipboard.value = { type: 'copy', paths: Array.from(selectedItems.value) }
}

const handlePaste = async () => {
  if (!clipboard.value) return
  for (const p of clipboard.value.paths) {
    const name = p.split('/').pop()
    const targetPath = `${currentPath.value}/${name}`
    if (clipboard.value.type === 'cut') {
      const moveFn = (fs as any).moveItem || (fs as any).rename
      if (moveFn) await moveFn(p, targetPath)
    } else {
      const copyFn = (fs as any).copyItem || (fs as any).copy
      if (copyFn) await copyFn(p, targetPath)
    }
  }
  if (clipboard.value.type === 'cut') clipboard.value = null
  fetchContents()
}

const handleDeleteSelected = async () => {
  // 使用系统级 Confirm 替代原生 confirm()
  showMessage({
    title: '删除项目',
    content: '确定要将这些所选项目放入回收站吗？',
    type: 'confirm',
    onConfirm: async () => {
      const rmFn = (fs as any).deleteItem || (fs as any).rm
      for (const p of selectedItems.value) {
        if (rmFn) await rmFn(p)
      }
      selectedItems.value.clear()
      fetchContents()
    }
  })
}

const handleRenameSelected = async (oldPath: string) => {
  const oldName = oldPath.split('/').pop()
  const newName = prompt('重命名为:', oldName)
  if (newName && newName !== oldName) {
    const renFn = (fs as any).renameItem || (fs as any).rename
    if (renFn) await renFn(oldPath, `${currentPath.value}/${newName}`)
    fetchContents()
  }
}

const handleMoveItems = async (sourcePaths: string[], targetDirPath: string) => {
  const moveFn = (fs as any).moveItem || (fs as any).rename
  if (!moveFn) return
  for (const p of sourcePaths) {
    const name = p.split('/').pop()
    await moveFn(p, `${targetDirPath}/${name}`)
  }
  fetchContents()
}

const handleShare = () => {
  alert('暂不支持分享功能')
}

// === 视图与右键菜单 ===
const setViewMode = (mode: string) => {
  viewMode.value = mode
}
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'icons' ? 'details' : 'icons'
}
const toggleSort = (field: string) => {
  if (sortField.value === field) sortDesc.value = !sortDesc.value
  else {
    sortField.value = field
    sortDesc.value = false
  }
}
const changeSort = (field: string) => toggleSort(field)

const openItemContextMenu = (e: MouseEvent, item: any) => {
  if (!selectedItems.value.has(item.path)) selectItem(item.path)
  ctxMenu.showMenu(e, [
    { label: '打开', action: () => handleItemOpen(item) },
    { label: '复制', action: handleCopy },
    { label: '剪切', action: handleCut },
    { label: '重命名', action: () => handleRenameSelected(item.path) },
    { divided: true, label: '删除', action: handleDeleteSelected }
  ])
}

const openBlankContextMenu = (e: MouseEvent) => {
  ctxMenu.showMenu(e, [
    { label: '刷新', action: forceRefresh },
    { label: '粘贴', disabled: !clipboard.value, action: handlePaste },
    { divided: true, label: '新建文件夹', action: handleNewFolder },
    { label: '新建文本文档', action: handleNewFile }
  ])
}

const confirmPick = () => {
  if (props.onPick && selectedFileName.value) {
    props.onPick(`C:/Users/Public/Desktop/${selectedFileName.value}`)
  }
}

const cancelPick = () => {
  if (props.onCancel) props.onCancel()
}
</script>

<style scoped>
.win11-explorer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.main-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
