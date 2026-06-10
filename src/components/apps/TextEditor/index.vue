<template>
  <div class="editor-root">
    <div class="tabs-bar" ref="tabsBarRef">
      <div 
        v-for="tab in tabs" :key="tab.id" 
        class="tab-item" 
        :class="{ active: activeTabId === tab.id }"
        @click="switchTab(tab.id)"
      >
        <span class="tab-filename">{{ tab.filePath ? tab.filePath.split('/').pop() : '未命名.txt' }}</span>
        <button class="close-tab-btn" @click.stop="closeTab(tab.id)" v-if="tabs.length > 1">×</button>
      </div>
      <button class="add-tab-btn" @click.stop="addNewTab">+</button>
    </div>

    <div class="toolbar">
      <input v-model="activeTab.filePath" class="filename" placeholder="文件名 (例如: note.txt)" />
      <button title="保存" @click="save">保存</button>
      <button title="关闭当前标签" @click="closeTab(activeTabId)" :disabled="tabs.length <= 1">关闭标签</button>
    </div>

    <textarea v-model="activeTab.content" class="editor-area" spellcheck="false"></textarea>

    <div class="statusbar">
      <span>{{ activeTab.filePath || '未命名' }}</span>
      <span class="spacer"></span>
      <span>大小: {{ byteSize }} bytes</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useFileSystem } from '@/composables'

const props = defineProps<{
  currentFilePath?: string
}>()

const { readFile, writeFile } = useFileSystem()

interface EditorTab {
  id: string
  filePath: string
  content: string
}

const tabIdGen = ref(0)
const tabs = ref<EditorTab[]>([])
const activeTabId = ref<string>('')
const tabsBarRef = ref<HTMLDivElement | null>(null)

// 滚动到最右边
const scrollToRight = () => {
  if (tabsBarRef.value) {
    tabsBarRef.value.scrollLeft = tabsBarRef.value.scrollWidth
  }
}

// 初始化或加载标签页
const initTab = (path?: string) => {
  const p = path || ''
  
  // 如果该文件已在此实例中打开，则直接切换过去
  const existing = p && tabs.value.find(t => t.filePath === p)
  if (existing) {
    activeTabId.value = existing.id
    return
  }

  const content = p ? (readFile(p) || '') : ''
  const newTab: EditorTab = { 
    id: `tab_${++tabIdGen.value}`, 
    filePath: p, 
    content 
  }
  
  tabs.value.push(newTab)
  activeTabId.value = newTab.id
  
  // 等待 DOM 更新后滚动到最右边
  nextTick(() => {
    scrollToRight()
  })
}

// 监听外界通过 props 传入的文件变化（支持外部通过文件管理器拉起文本编辑器）
watch(() => props.currentFilePath, (newPath) => {
  initTab(newPath)
}, { immediate: true })

// 当前激活的 Tab
const activeTab = computed(() => {
  return tabs.value.find(t => t.id === activeTabId.value) ?? { id: '', filePath: '', content: '' }
})

// 标签页操作方法
const switchTab = (id: string) => {
  activeTabId.value = id
}

const addNewTab = () => {
  initTab('')
}

const closeTab = (id: string) => {
  const index = tabs.value.findIndex(t => t.id === id)
  if (index === -1) return
  
  tabs.value.splice(index, 1)
  if (activeTabId.value === id && tabs.value.length > 0) {
    activeTabId.value = tabs.value[Math.min(index, tabs.value.length - 1)].id
  }
}

// 保存逻辑
function save() {
  if (!activeTab.value.filePath) {
    alert('请输入文件名后再保存！')
    return
  }
  writeFile(activeTab.value.filePath, activeTab.value.content)
  alert('保存成功！')
}

// 计算大小
const byteSize = computed(() => new Blob([activeTab.value.content]).size)

onMounted(() => {
  if (tabs.value.length === 0) {
    addNewTab()
  }
})
</script>

<style scoped>
.editor-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(6, 10, 20, 0.95);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

/* 标签页样式 - 优化滚动体验 */
.tabs-bar {
  display: flex;
  background: rgba(10, 14, 26, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  overflow-x: auto;
  overflow-y: hidden;
  align-items: center;
  padding: 4px 8px 0 8px;
  gap: 4px;
  scrollbar-width: none; /* Firefox 隐藏滚动条 */
  -ms-overflow-style: none; /* IE/Edge 隐藏滚动条 */
  scroll-behavior: smooth; /* 平滑滚动效果 */
}

/* 隐藏滚动条但保持滚动功能 */
.tabs-bar::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera 隐藏滚动条 */
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #a0aec0;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-bottom: none;
  min-width: 120px; /* 限制最小宽度 */
  max-width: 240px; /* 限制最大宽度 */
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}

.tab-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.tab-item.active {
  background: rgba(6, 10, 20, 0.95);
  color: #fff;
  font-weight: 500;
  box-shadow: 0 -2px 8px rgba(90, 124, 255, 0.3);
  border-color: rgba(90, 124, 255, 0.3);
}

.tab-filename {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-tab-btn {
  background: transparent;
  border: none;
  color: #a0aec0;
  font-size: 14px;
  cursor: pointer;
  padding: 0 2px;
  border-radius: 4px;
  opacity: 0.7;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.tab-item:hover .close-tab-btn {
  opacity: 1;
}

.close-tab-btn:hover {
  background: rgba(255, 0, 0, 0.2);
  color: #ff8585;
}

.add-tab-btn {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #fff;
  padding: 6px 12px;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  cursor: pointer;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.add-tab-btn:hover {
  background: rgba(90, 124, 255, 0.2);
  transform: scale(1.05);
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background: rgba(15, 20, 35, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.filename {
  min-width: 180px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  color: #eef2ff;
  outline: none;
  transition: all 0.2s ease;
}

.filename:focus {
  border-color: rgba(90, 124, 255, 0.3);
  box-shadow: 0 0 0 2px rgba(90, 124, 255, 0.1);
}

button {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: rgba(90, 124, 255, 0.14);
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

button:hover {
  background: rgba(90, 124, 255, 0.25);
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.editor-area {
  flex: 1;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  resize: none;
  color: #eaf0ff;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 14px;
  outline: none;
  line-height: 1.6;
  caret-color: #5a7cff;
}

.editor-area:focus {
  box-shadow: inset 0 0 0 1px rgba(90, 124, 255, 0.2);
}

.statusbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(10, 14, 24, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.02);
  color: #9fb0e6;
  font-size: 12px;
}

.spacer {
  flex: 1;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .tab-item {
    min-width: 100px;
    padding: 6px 8px;
    font-size: 11px;
  }
  
  .add-tab-btn {
    min-width: 32px;
    padding: 6px 8px;
  }
  
  .toolbar {
    flex-wrap: wrap;
  }
  
  .filename {
    min-width: 120px;
  }
}
</style>