<template>
    <div class="win11-explorer" @click="handleGlobalClick">

        <div class="command-bar">
            <div class="cmd-group relative">
                <button class="cmd-btn" @click.stop="toggleNewMenu">
                    <span class="icon text-primary">➕</span> 新建 <span class="arrow">⌄</span>
                </button>
                <div v-if="newMenuVisible" class="dropdown-menu win11-menu" @click.stop>
                    <div class="menu-item" @click="handleNewFolder"><span class="menu-icon">📁</span> 文件夹</div>
                    <div class="menu-item" @click="handleNewFile"><span class="menu-icon">📄</span> 文本文档</div>
                </div>
            </div>

            <div class="cmd-divider"></div>

            <div class="cmd-group">
                <button class="cmd-icon-btn" title="剪切" :disabled="!selectedItem" @click.stop="handleCut"><span
                        class="icon">✂️</span></button>
                <button class="cmd-icon-btn" title="复制" :disabled="!selectedItem" @click.stop="handleCopy"><span
                        class="icon">📋</span></button>
                <button class="cmd-icon-btn" title="粘贴" :disabled="!clipboard" @click.stop="handlePaste"><span
                        class="icon">📥</span></button>
                <button class="cmd-icon-btn" title="重命名" :disabled="!selectedItem"
                    @click.stop="handleRenameSelected"><span class="icon">📝</span></button>
                <button class="cmd-icon-btn" title="共享" :disabled="!selectedItem" @click.stop="handleShare"><span
                        class="icon">🔗</span></button>
                <button class="cmd-icon-btn" title="删除" :disabled="!selectedItem"
                    @click.stop="handleDeleteSelected"><span class="icon">🗑️</span></button>
            </div>

            <div class="cmd-divider"></div>

            <div class="cmd-group">
                <button class="cmd-btn" title="切换排序方式" @click.stop="toggleSort">
                    <span class="icon">🔃</span> {{ sortLabel }}
                </button>
                <button class="cmd-btn" title="切换视图" @click.stop="toggleViewMode">
                    <span class="icon">🪟</span> {{ viewMode === 'details' ? '详细信息' : '大图标' }}
                </button>
            </div>
            <div class="cmd-spacer"></div>
            <button class="cmd-icon-btn" title="属性" :disabled="!selectedItem"
                @click.stop="showProperties(selectedItemMeta)"><span class="icon">ℹ️</span></button>
        </div>

        <div class="address-bar-container">
            <div class="nav-buttons">
                <button class="nav-btn" :disabled="historyIndex <= 0" title="后退" @click="goBack">←</button>
                <button class="nav-btn" :disabled="historyIndex >= history.length - 1" title="前进"
                    @click="goForward">→</button>
                <button class="nav-btn" :disabled="currentPath === ''" title="向上" @click="goUp">↑</button>
                <button class="nav-btn" title="刷新" @click="forceRefresh">↻</button>
            </div>

            <div class="address-bar" @click="startEditingPath">
                <span class="icon lead-icon">{{ currentPath === '' ? '💻' : '📁' }}</span>
                <span v-if="currentPath !== '' && !isEditingPath" class="separator">›</span>

                <input v-if="isEditingPath" ref="pathInputRef" v-model="pathInput" type="text" class="path-input"
                    @blur="submitPath" @keyup.enter="submitPath" />

                <div v-else class="breadcrumbs">
                    <span class="crumb-item" @click.stop="navigateTo('')">此电脑</span>
                    <span v-for="(segment, index) in pathSegments" :key="index" class="crumb-wrapper">
                        <span class="separator">›</span>
                        <span class="crumb-item" @click.stop="navigateToSegment(index)">{{ segment }}</span>
                    </span>
                </div>
            </div>

            <div class="search-bar">
                <input v-model="searchQuery" type="text"
                    :placeholder="`搜索 ${currentPath ? pathSegments[pathSegments.length - 1] : '此电脑'}`" />
                <span class="search-icon" @click="searchQuery = ''">{{ searchQuery ? '✖' : '🔍' }}</span>
            </div>
        </div>

        <div class="main-content">
            <div class="sidebar">
                <ul class="nav-tree">
                    <li class="nav-group-title">主页</li>
                    <li class="nav-item" :class="{ active: currentPath === 'C:/Users/Admin/Desktop' }"
                        @click="navigateTo('C:/Users/Admin/Desktop')">
                        <span class="icon">🖥️</span> <span class="nav-text">桌面</span>
                    </li>
                    <li class="nav-item" :class="{ active: currentPath === 'C:/Users/Admin/Downloads' }"
                        @click="navigateTo('C:/Users/Admin/Downloads')">
                        <span class="icon">⬇️</span> <span class="nav-text">下载</span>
                    </li>
                    <li class="nav-item" :class="{ active: currentPath === 'C:/Users/Admin/Documents' }"
                        @click="navigateTo('C:/Users/Admin/Documents')">
                        <span class="icon">📄</span> <span class="nav-text">文档</span>
                    </li>
                    <li class="nav-spacer"></li>
                    <li class="nav-item" :class="{ active: currentPath === '' }" @click="navigateTo('')">
                        <span class="icon">💻</span> <span class="nav-text">此电脑</span>
                    </li>
                    <li class="nav-item sub-item" :class="{ active: currentPath === 'C:' }" @click="navigateTo('C:')">
                        <span class="icon">💽</span> <span class="nav-text">Windows (C:)</span>
                    </li>
                    <li class="nav-item sub-item" :class="{ active: currentPath === 'D:' }" @click="navigateTo('D:')">
                        <span class="icon">💽</span> <span class="nav-text">Data (D:)</span>
                    </li>
                </ul>
            </div>

            <div class="file-view" @contextmenu.prevent="openBlankContextMenu">

                <table v-if="viewMode === 'details'" class="file-table">
                    <thead>
                        <tr>
                            <th class="col-name" @click="changeSort('name')">名称 {{ sortField === 'name' ? (sortDesc ?
                                '↓' : '↑') : '' }}</th>
                            <th class="col-date" @click="changeSort('mtime')">修改日期 {{ sortField === 'mtime' ? (sortDesc
                                ? '↓' : '↑') : '' }}</th>
                            <th class="col-type" @click="changeSort('type')">类型 {{ sortField === 'type' ? (sortDesc ?
                                '↓' : '↑') : '' }}</th>
                            <th class="col-size" @click="changeSort('size')">大小 {{ sortField === 'size' ? (sortDesc ?
                                '↓' : '↑') : '' }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in displayedContents" :key="item.path" class="file-row"
                            :class="{ 'selected': selectedItem === item.path, 'cut-pending': clipboard?.type === 'cut' && clipboard.path === item.path }"
                            @click.stop="selectItem(item.path)" @dblclick.stop="handleItemOpen(item)"
                            @contextmenu.prevent.stop="openItemContextMenu($event, item)">
                            <td><span class="file-icon">{{ getIcon(item) }}</span><span class="file-name">{{ item.name
                                    }}</span></td>
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
                    <div v-for="item in displayedContents" :key="item.path" class="icon-item"
                        :class="{ 'selected': selectedItem === item.path, 'cut-pending': clipboard?.type === 'cut' && clipboard.path === item.path }"
                        @click.stop="selectItem(item.path)" @dblclick.stop="handleItemOpen(item)"
                        @contextmenu.prevent.stop="openItemContextMenu($event, item)">
                        <div class="large-icon">{{ getIcon(item) }}</div>
                        <div class="icon-name" :title="item.name">{{ item.name }}</div>
                    </div>
                    <div v-if="displayedContents.length === 0" class="empty-state full-width">
                        <span class="empty-icon">{{ searchQuery ? '🔍' : '📁' }}</span>
                        <p>{{ searchQuery ? '没有找到符合条件的项目。' : '此文件夹为空。' }}</p>
                    </div>
                </div>

            </div>
        </div>

        <div class="status-bar">
            <div class="status-item">{{ displayedContents.length }} 个项目</div>
            <div v-if="selectedItem" class="status-divider"></div>
            <div v-if="selectedItem" class="status-item">选中 1 个项目</div>
            <div class="status-spacer"></div>
            <div class="status-item view-options">
                <span class="icon" :class="{ active: viewMode === 'details' }" title="详细信息"
                    @click="viewMode = 'details'">≣</span>
                <span class="icon" :class="{ active: viewMode === 'icons' }" title="大图标"
                    @click="viewMode = 'icons'">⊞</span>
            </div>
        </div>

        <div v-if="contextMenu.visible" class="context-menu win11-menu"
            :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }" @click.stop>
            <template v-if="contextMenu.targetItem">
                <div class="menu-item bold" @click="handleItemOpen(contextMenu.targetItem)"><span
                        class="menu-icon">📂</span> 打开</div>
                <div class="menu-separator"></div>
                <div class="menu-item" @click="handleCut"><span class="menu-icon">✂️</span> 剪切</div>
                <div class="menu-item" @click="handleCopy"><span class="menu-icon">📋</span> 复制</div>
                <div class="menu-item" @click="handleRenameSelected"><span class="menu-icon">📝</span> 重命名</div>
                <div class="menu-item" @click="handleDeleteSelected"><span class="menu-icon text-danger">🗑️</span>
                    <span class="text-danger">删除</span>
                </div>
                <div class="menu-separator"></div>
                <div class="menu-item" @click="showProperties(contextMenu.targetItem)"><span class="menu-icon">ℹ️</span>
                    属性</div>
            </template>
            <template v-else>
                <div class="menu-item" :class="{ disabled: !clipboard }" @click="handlePaste"><span
                        class="menu-icon">📥</span> 粘贴</div>
                <div class="menu-separator"></div>
                <div class="menu-item" @click="handleNewFolder"><span class="menu-icon">📁</span> 新建文件夹</div>
                <div class="menu-item" @click="handleNewFile"><span class="menu-icon">📄</span> 新建文本文档</div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useFileSystem } from '@/composables/useFileSystem'
import type { FileMetadata } from '@/services/fs'

const { readDirectory, writeFile, readFile, createDirectory, deleteFile, renameFile, getMetadata } = useFileSystem()

// 导航状态
const history = ref<string[]>(['C:/Users/Admin'])
const historyIndex = ref(0)
const currentPath = computed(() => history.value[historyIndex.value] ?? '')
const pathSegments = computed(() => currentPath.value ? currentPath.value.split('/') : [])

// 强制刷新 Key
const refreshKey = ref(0)
const forceRefresh = () => { refreshKey.value++ }

// === 修复：地址栏点击编辑功能 ===
const isEditingPath = ref(false)
const pathInput = ref('')
const pathInputRef = ref<HTMLInputElement | null>(null)

const startEditingPath = async () => {
    isEditingPath.value = true
    pathInput.value = currentPath.value === '' ? '此电脑' : currentPath.value
    await nextTick()
    pathInputRef.value?.focus()
    pathInputRef.value?.select()
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
const clipboard = ref<{ type: 'copy' | 'cut', path: string, itemType: 'file' | 'directory' } | null>(null)

const displayedContents = computed(() => {
    let list = readDirectory(currentPath.value)
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(item => item.name.toLowerCase().includes(q))
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
const selectedItemMeta = computed(() => selectedItem.value ? getMetadata(selectedItem.value) : null)

const contextMenu = ref({ visible: false, x: 0, y: 0, targetItem: null as FileMetadata | null })
const newMenuVisible = ref(false)

const toggleNewMenu = () => { newMenuVisible.value = !newMenuVisible.value; contextMenu.value.visible = false }

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
const goBack = () => { if (historyIndex.value > 0) { historyIndex.value--; clearSelection() } }
const goForward = () => { if (historyIndex.value < history.value.length - 1) { historyIndex.value++; clearSelection() } }
const goUp = () => {
    if (currentPath.value === '') return
    const parts = currentPath.value.split('/')
    parts.pop()
    navigateTo(parts.join('/'))
}
const navigateToSegment = (index: number) => { navigateTo(pathSegments.value.slice(0, index + 1).join('/')) }

// === UI 交互 ===
const selectItem = (path: string) => { selectedItem.value = path }
const clearSelection = () => { selectedItem.value = null }
const changeSort = (field: 'name' | 'mtime' | 'size' | 'type') => {
    if (sortField.value === field) sortDesc.value = !sortDesc.value
    else { sortField.value = field; sortDesc.value = false }
}
const toggleSort = () => {
    const fields: ('name' | 'mtime' | 'size')[] = ['name', 'mtime', 'size']
    const idx = fields.indexOf(sortField.value as any)
    changeSort(fields[(idx + 1) % fields.length])
}
const toggleViewMode = () => { viewMode.value = viewMode.value === 'details' ? 'icons' : 'details' }

const handleItemOpen = (item: FileMetadata) => {
    contextMenu.value.visible = false
    if (item.type === 'directory') navigateTo(item.path)
    else window.dispatchEvent(new CustomEvent('vfs-open-file', { detail: { appId: 'text-editor', filePath: item.path } }))
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
    contextMenu.value.visible = false; newMenuVisible.value = false
    const defaultName = getUniqueName('新建文件夹')
    const name = prompt('新建文件夹名称:', defaultName)
    if (name) {
        createDirectory(currentPath.value === '' ? name : `${currentPath.value}/${name}`)
        forceRefresh()
    }
}

const handleNewFile = () => {
    contextMenu.value.visible = false; newMenuVisible.value = false
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
    clipboard.value = { type: 'cut', path: selectedItemMeta.value.path, itemType: selectedItemMeta.value.type }
}
const handleCopy = () => {
    if (!selectedItemMeta.value) return
    clipboard.value = { type: 'copy', path: selectedItemMeta.value.path, itemType: selectedItemMeta.value.type }
}
const handlePaste = () => {
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
        if (renameFile(path, targetPath)) clipboard.value = null
        else alert('移动失败：目标可能已存在。')
    } else {
        if (itemType === 'file') {
            const content = readFile(path)
            if (content !== null) writeFile(targetPath, content)
        } else alert('虚拟系统暂不支持复制整个文件夹，请使用剪切或进入内部复制。')
    }
    forceRefresh()
}

// === 其它原生级操作 ===
const handleShare = async () => {
    if (!selectedItemMeta.value) return
    try {
        await navigator.share({ title: selectedItemMeta.value.name, text: `分享文件: ${selectedItemMeta.value.name}`, url: window.location.href })
    } catch (err) { alert(`系统不支持 Share API：欲分享 [${selectedItemMeta.value.name}]`) }
}
const showProperties = (item: FileMetadata | null) => {
    if (!item) return
    alert(`【文件属性】\n\n名称：${item.name}\n类型：${getTypeName(item)}\n位置：${item.path}\n大小：${formatSize(item.size)}\n修改时间：${formatDate(item.mtime)}`)
}
const handleDeleteSelected = () => {
    if (selectedItem.value && confirm(`确定要永久删除此项吗？`)) {
        deleteFile(selectedItem.value)
        if (clipboard.value?.path === selectedItem.value) clipboard.value = null
        selectedItem.value = null
        forceRefresh()
    }
}
const handleRenameSelected = () => {
    if (!selectedItem.value) return
    const oldName = selectedItem.value.split('/').pop() || ''
    const newName = prompt('重命名为:', oldName)
    if (newName && newName !== oldName) {
        const basePath = currentPath.value === '' ? '' : currentPath.value + '/'
        renameFile(selectedItem.value, basePath + newName)
        selectedItem.value = basePath + newName
        forceRefresh()
    }
}

// === 辅助格式化 ===
const getIcon = (item: FileMetadata) => {
    if (item.type === 'directory') return item.path.includes('/') ? '📁' : '💽'
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
</script>

<style scoped>
/* 全局基础与配色 */
.win11-explorer {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
    background-color: #F3F3F3;
    color: #1A1A1A;
    user-select: none;
    position: relative;
}

/* 1. 命令栏 (Command Bar) */
.command-bar {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background-color: #F3F3F3;
    border-bottom: 1px solid #E5E5E5;
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

/* 下拉菜单定位基准 */
.cmd-divider {
    width: 1px;
    height: 16px;
    background-color: #CCCCCC;
    margin: 0 8px;
}

.cmd-spacer {
    flex: 1;
}

.cmd-btn,
.cmd-icon-btn {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    color: #1A1A1A;
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
    background-color: #FFFFFF;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border-color: #E5E5E5;
}

.cmd-btn:active:not(:disabled),
.cmd-icon-btn:active:not(:disabled) {
    background-color: #F9F9F9;
}

.cmd-btn:disabled,
.cmd-icon-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.text-primary {
    color: #0067C0;
}

/* 2. 地址栏区 */
.address-bar-container {
    display: flex;
    padding: 8px 12px;
    background-color: #F3F3F3;
    gap: 12px;
    align-items: center;
}

.nav-buttons {
    display: flex;
    gap: 2px;
}

.nav-btn {
    background: transparent;
    border: none;
    border-radius: 4px;
    width: 32px;
    height: 32px;
    font-size: 16px;
    color: #1A1A1A;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-btn:hover:not(:disabled) {
    background-color: #E0E0E0;
}

.nav-btn:disabled {
    color: #A0A0A0;
    cursor: not-allowed;
}

.address-bar,
.search-bar {
    background-color: #FFFFFF;
    border: 1px solid #E5E5E5;
    border-radius: 4px;
    height: 32px;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) inset;
}

.address-bar {
    flex: 1;
    padding: 0 8px;
    border-bottom: 1px solid #D1D1D1;
    cursor: text;
}

.address-bar:hover,
.search-bar:hover {
    border-color: #D1D1D1;
}

.path-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 13px;
    padding: 0 4px;
    width: 100%;
    background: transparent;
}

.lead-icon {
    font-size: 14px;
    margin-right: 4px;
}

.separator {
    margin: 0 4px;
    color: #666;
    font-size: 14px;
}

.breadcrumbs {
    display: flex;
    align-items: center;
    font-size: 13px;
}

.crumb-item {
    padding: 2px 4px;
    border-radius: 4px;
    cursor: pointer;
}

.crumb-item:hover {
    background-color: #F3F3F3;
}

.search-bar {
    width: 240px;
    padding: 0 8px;
    border-bottom: 1px solid #D1D1D1;
}

.search-bar input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 13px;
    background: transparent;
}

.search-icon {
    font-size: 12px;
    color: #666;
    cursor: pointer;
}

/* 3. 主体布局 & 左侧边栏 */
.main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    background-color: #FFFFFF;
}

.sidebar {
    width: 200px;
    background-color: #F3F3F3;
    padding: 12px 8px;
    overflow-y: auto;
}

.nav-tree {
    list-style: none;
    padding: 0;
    margin: 0;
}

.nav-group-title {
    font-size: 11px;
    font-weight: 600;
    color: #666;
    margin: 8px 0 4px 12px;
}

.nav-spacer {
    height: 16px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    margin-bottom: 2px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    position: relative;
}

.nav-item:hover {
    background-color: #EAEAEA;
}

.nav-item.active {
    background-color: #E4E4E4;
    font-weight: 600;
}

.nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 25%;
    height: 50%;
    width: 3px;
    background-color: #0067C0;
    border-radius: 4px;
}

.sub-item {
    padding-left: 32px;
}

.nav-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 4. 文件列表区 */
.file-view {
    flex: 1;
    overflow-y: auto;
    background-color: #FFFFFF;
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
    background: #FFFFFF;
    border-bottom: 1px solid #F0F0F0;
    cursor: pointer;
    user-select: none;
}

.file-table th:hover {
    background-color: #F9F9F9;
}

.file-row {
    border-bottom: 1px solid transparent;
    border-radius: 4px;
}

.file-row:hover {
    background-color: #F6F6F6;
}

.file-row.selected {
    background-color: #E8F0F4;
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
    background-color: #F6F6F6;
}

.icon-item.selected {
    background-color: #E8F0F4;
    border-color: #D2E4F0;
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

/* 5. 状态栏 */
.status-bar {
    height: 28px;
    background-color: #F3F3F3;
    border-top: 1px solid #E5E5E5;
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
    background-color: #CCC;
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
    color: #0067C0;
}

/* 6. Win11 风格浮动菜单 */
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

.dropdown-menu {
    top: 100%;
    left: 0;
    margin-top: 4px;
}

/* 新建下拉按钮特定定位 */

.menu-item {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    color: #1A1A1A;
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
    background-color: #E5E5E5;
    margin: 4px 0;
}

.text-danger {
    color: #D13438;
}
</style>