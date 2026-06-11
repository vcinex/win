<template>
  <div class="desktop-shell">
    <div class="desktop-background"></div>

    <div class="window-layer">
      <Window
        v-for="windowState in visibleWindows"
        :key="windowState.id"
        :window-state="windowState"
        @focus="focusWindow"
        @close="closeWindow"
        @minimize="minimizeWindow"
        @update="updateWindow"
      />
    </div>

    <Taskbar />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useWindowStore } from '@/store/windows'
import { useWindowManager } from '@/composables/useWindowManager'
import Window from '../Window/index.vue'
import Taskbar from '../Taskbar/index.vue'
import type { WindowState } from '@/types'

const windowStore = useWindowStore()
const windowManager = useWindowManager() // ✅ 引入窗口管理器
const visibleWindows = computed(() => windowStore.windows)

function focusWindow(id: string) {
  windowStore.focusWindow(id)
}

function closeWindow(id: string) {
  windowStore.closeWindow(id)
}

function minimizeWindow(id: string) {
  windowStore.minimizeWindow(id)
}

function updateWindow(id: string, updates: Partial<WindowState>) {
  windowStore.updateWindow(id, updates)
}

// ✅ 监听从文件管理器广播出的双击打开文件事件
const handleGlobalFileOpen = (event: Event) => {
  const customEvent = event as CustomEvent
  const { appId, filePath } = customEvent.detail

  if (appId) {
    // 携带 props 参数拉起目标窗口
    windowManager.openApp(appId, { props: { currentFilePath: filePath } })
  }
}

onMounted(() => {
  window.addEventListener('vfs-open-file', handleGlobalFileOpen)
})

onUnmounted(() => {
  window.removeEventListener('vfs-open-file', handleGlobalFileOpen)
})
</script>

<style scoped>
/* 使用 fixed + inset 确保占满视口且不触发外部滚动 */
.desktop-shell {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #1b2340 0%, #0e1528 100%);
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* 背景层：提供渐变并作为 fallback 色 */
.desktop-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-color: #0e1528;
  /* fallback */
  background-image:
    radial-gradient(circle at 10% 10%, rgba(84, 94, 255, 0.18), transparent 30%),
    linear-gradient(135deg, #1b2340 0%, #0e1528 100%);
  pointer-events: none;
}

/* 窗口层放在背景之上 */
.window-layer {
  position: absolute;
  inset: 0;
  padding: 12px;
  z-index: 10;
  pointer-events: none;
  /* 单个窗口接收事件 */
}

.window-layer > * {
  pointer-events: auto;
}

/* 确保任务栏始终在最上层 */
:deep(.taskbar) {
  z-index: 30;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
