<template>
  <footer class="taskbar">
    <button
      class="start-button"
      @click.stop="windowStore.startMenuOpen = !windowStore.startMenuOpen"
    >
      Start
    </button>

    <div class="taskbar-windows">
      <button
        v-for="windowState in openWindows"
        :key="windowState.id"
        class="taskbar-item"
        :class="{ active: windowState.id === windowStore.activeWindowId && !windowState.minimized }"
        @click="handleTaskbarClick(windowState)"
      >
        {{ windowState.title }}
      </button>
    </div>

    <div class="start-menu" v-show="windowStore.startMenuOpen" @click.stop>
      <div class="start-menu-header">
        <span>所有应用</span>
      </div>
      <div class="app-grid">
        <button v-for="app in apps" :key="app.id" class="app-item" @click="handleOpenApp(app.id)">
          <span class="app-icon">{{ app.icon }}</span>
          <span class="app-name">{{ app.name || app.title }}</span>
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWindowStore } from '@/store'
import { listApps } from '@/services'
import { useWindowManager } from '@/composables'
import type { WindowState } from '@/types'

const windowStore = useWindowStore()
const { openApp } = useWindowManager()

const apps = listApps()
const openWindows = computed(() => windowStore.windows)

function handleTaskbarClick(win: WindowState) {
  if (windowStore.activeWindowId === win.id && !win.minimized) {
    windowStore.minimizeWindow(win.id)
  } else {
    windowStore.focusWindow(win.id)
  }
}

function handleOpenApp(appId: string) {
  openApp(appId)
  windowStore.startMenuOpen = false
}
</script>

<style scoped>
/* 任务栏基础样式（根据你的项目调整，重点添加开始菜单样式） */
.taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: rgba(243, 243, 243, 0.85);
  backdrop-filter: blur(20px);
  /* 毛玻璃效果 */
  display: flex;
  align-items: center;
  z-index: 9999;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.start-button {
  background: transparent;
  border: none;
  padding: 0 16px;
  height: 100%;
  cursor: pointer;
  font-weight: 500;
}

.start-button:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* 现代 Windows 风格的开始菜单 */
.start-menu {
  position: absolute;
  bottom: 48px;
  /* 悬浮在任务栏上方 */
  left: 8px;
  width: 360px;
  max-height: 480px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  /* 圆角 */
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.15),
    0 0 1px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  animation: menuFadeIn 0.15s ease-out;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.start-menu-header {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-left: 4px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  /* 四列网格布局，类似Win开始菜单 */
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
}

.app-item {
  background: transparent;
  border: none;
  border-radius: 4px;
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: background 0.1s;
}

.app-item:hover {
  background: rgba(0, 0, 0, 0.06);
  /* 悬停微灰背景 */
}

.app-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.app-name {
  font-size: 11px;
  color: #2c3e50;
  text-align: center;
  word-break: break-all;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* 任务栏窗口项样式微调 */
.taskbar-windows {
  display: flex;
  height: 100%;
  flex-grow: 1;
}

.taskbar-item {
  background: transparent;
  border: none;
  padding: 0 12px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}

.taskbar-item.active {
  background: rgba(0, 0, 0, 0.08);
  border-bottom: 3px solid #0067c0;
  /* 模拟 Windows 任务栏激活指示条 */
}
</style>
