<template>
  <div class="editor-root">
    <div ref="tabsBarRef" class="tabs-bar">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ active: activeTabId === tab.id }"
        @click="switchTab(tab.id)"
      >
        <span class="tab-filename">
          {{ tab.filePath ? tab.filePath.split('/').pop() : '未命名.txt' }}
        </span>
        <button v-if="tabs.length > 1" class="close-tab-btn" @click.stop="closeTab(tab.id)">
          ×
        </button>
      </div>
      <button class="add-tab-btn" @click.stop="addNewTab">+</button>
    </div>

    <div class="toolbar">
      <input
        v-model="activeTab.filePath"
        class="filename"
        placeholder="文件路径 (如 C:/note.txt)"
      />
      <button title="保存" @click="save">保存文件</button>
      <button title="关闭当前标签" :disabled="tabs.length <= 1" @click="closeTab(activeTabId)">
        关闭标签
      </button>
    </div>

    <textarea v-model="activeTab.content" class="editor-area" spellcheck="false"></textarea>

    <div class="statusbar">
      <span>{{ activeTab.filePath || '未命名文件' }}</span>
      <span class="spacer"></span>
      <span>大小: {{ byteSize }} bytes</span>
    </div>

    <FileDialog v-if="isFilePickerOpen" @save="executeSave" @cancel="isFilePickerOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useFileSystem } from '@/composables/useFileSystem'
import FileDialog from '@/components/system/FileDialog/index.vue'
import { useNotification } from '@/composables/useNotification'

const { notify } = useNotification()
const isFilePickerOpen = ref(false)

const props = defineProps<{ currentFilePath?: string }>()
const { readFile, writeFile } = useFileSystem() as any // 获取系统的读写能力

interface EditorTab {
  id: string
  filePath: string
  content: string
}

const tabIdGen = ref(0)
const tabs = ref<EditorTab[]>([])
const activeTabId = ref<string>('')
const tabsBarRef = ref<HTMLDivElement | null>(null)

// 计算字节数用于底栏显示
const byteSize = computed(() => {
  return new Blob([activeTab.value.content || '']).size
})

const scrollToRight = () => {
  if (tabsBarRef.value) {
    tabsBarRef.value.scrollLeft = tabsBarRef.value.scrollWidth
  }
}

const initTab = async (path?: string) => {
  const p = path || ''
  const existing = p && tabs.value.find((t) => t.filePath === p)
  if (existing) {
    activeTabId.value = existing.id
    return
  }

  // 确保在能读取文件的时候读取文件
  let content = ''
  if (p && readFile) {
    try {
      content = await readFile(p)
    } catch (e) {
      console.warn('读取文件内容失败', e)
    }
  }

  const newTab: EditorTab = {
    id: `tab_${++tabIdGen.value}`,
    filePath: p,
    content
  }

  tabs.value.push(newTab)
  activeTabId.value = newTab.id
  nextTick(() => scrollToRight())
}

watch(
  () => props.currentFilePath,
  (newPath) => {
    if (newPath) initTab(newPath)
  },
  { immediate: true }
)

onMounted(() => {
  if (tabs.value.length === 0) initTab('')
})

const activeTab = computed(() => {
  return tabs.value.find((t) => t.id === activeTabId.value) ?? { id: '', filePath: '', content: '' }
})

const switchTab = (id: string) => {
  activeTabId.value = id
}
const addNewTab = () => {
  initTab('')
}

const closeTab = (id: string) => {
  const index = tabs.value.findIndex((t) => t.id === id)
  if (index !== -1) {
    tabs.value.splice(index, 1)
    if (activeTabId.value === id) {
      activeTabId.value = tabs.value[Math.max(0, index - 1)]?.id || ''
    }
  }
}

// 核心保存逻辑
// 1. 点击保存按钮触发
const save = () => {
  if (!activeTab.value.filePath) {
    // 没有路径，弹出系统文件选择器
    isFilePickerOpen.value = true
  } else {
    // 已有路径，直接静默执行保存
    executeSave(activeTab.value.filePath)
  }
}

// 2. 真正执行写入与反馈的逻辑
const executeSave = async (targetPath: string) => {
  isFilePickerOpen.value = false // 关闭选择器面板
  activeTab.value.filePath = targetPath

  if (writeFile) {
    try {
      await writeFile(activeTab.value.filePath, activeTab.value.content)
      // 使用 Win11 全局右下角通知替代原生 alert
      notify('保存成功', `文件已成功写入至 ${targetPath}`, 'success')
    } catch (e: any) {
      notify('保存失败', e.message, 'error')
    }
  }
}
</script>

<style scoped>
.editor-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(6, 10, 20, 0.95);
  overflow: hidden;
}

.tabs-bar {
  display: flex;
  background: #1e1e1e;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabs-bar::-webkit-scrollbar {
  display: none;
}

.tab-item {
  padding: 8px 12px;
  background: #2d2d2d;
  color: #ccc;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-right: 1px solid #1e1e1e;
  font-size: 13px;
  min-width: 100px;
}
.tab-item.active {
  background: rgba(6, 10, 20, 0.95);
  color: #fff;
}

.close-tab-btn {
  margin-left: 8px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
}
.close-tab-btn:hover {
  color: #ff5c5c;
}
.add-tab-btn {
  background: none;
  border: none;
  color: #ccc;
  padding: 0 12px;
  cursor: pointer;
  font-size: 18px;
}

.toolbar {
  display: flex;
  padding: 8px;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
}
.filename {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}
button {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: rgba(90, 124, 255, 0.14);
  color: #fff;
  cursor: pointer;
  font-size: 13px;
}
button:hover {
  background: rgba(90, 124, 255, 0.3);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-area {
  flex: 1;
  background: transparent;
  color: #d4d4d4;
  font-family: Consolas, monospace;
  font-size: 14px;
  padding: 10px;
  border: none;
  resize: none;
  outline: none;
}
.statusbar {
  display: flex;
  background: #007acc;
  color: white;
  padding: 4px 10px;
  font-size: 12px;
}
.spacer {
  flex: 1;
}
</style>
