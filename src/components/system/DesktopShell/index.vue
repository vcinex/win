<template>
  <main class="desktop-shell" @contextmenu.prevent="showDesktopMenu">
    <div class="desktop-background"></div>

    <div class="window-layer">
      <Window
        v-for="win in visibleWindows"
        :key="win.id"
        :window-state="win"
        @focus="focusWindow"
        @close="closeWindow"
        @minimize="minimizeWindow"
        @toggle-maximize="toggleMaximizeWindow"
        @update="updateWindow"
      />
    </div>

    <Taskbar class="taskbar-layer" />
  </main>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useAppManager } from '@/composables';
import type { WindowState } from '@/types';
import Window from './Window.vue';
import Taskbar from './Taskbar.vue';

const appManager = useAppManager();

const visibleWindows = appManager.windows;

// 代理 Store 和 Manager 的方法，解耦模板
const focusWindow = (id: string) => appManager.focusWindow(id);
const closeWindow = (id: string) => appManager.closeWindow(id);
const minimizeWindow = (id: string) => appManager.minimizeWindow(id);
const toggleMaximizeWindow = (id: string) => appManager.toggleMaximizeWindow(id);
const updateWindow = (id: string, updates: Partial<WindowState>) =>
  appManager.updateWindow(id, updates);

const showDesktopMenu = (e: MouseEvent) => {
  // TODO: 后续可在此处挂载并调用 ContextMenu 弹窗逻辑
  console.log('Desktop right click triggered at', e.clientX, e.clientY);
};

// 监听跨组件系统意图（解耦机制：其它应用发送意图唤起别的应用）
const handleSystemIntent = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { action, appId, payload } = customEvent.detail;

  if (action === 'OPEN_FILE' && appId) {
    appManager.launchApp(appId, { props: payload });
  }
};

onMounted(() => {
  window.addEventListener('os-intent', handleSystemIntent);
});

onUnmounted(() => {
  window.removeEventListener('os-intent', handleSystemIntent);
});
</script>

<style scoped>
.desktop-shell {
  position: fixed;
  inset: 0;
  overflow: hidden;
  user-select: none;
  background-color: #000; /* Fallback fallback */
}

.desktop-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  /* 现代默认壁纸风格替代，未来可改为图片 */
  background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%);
  background-size: cover;
  background-position: center;
}

.window-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  /* 极其关键：让事件穿透到下层桌面，否则无法点右键和拖拽图标 */
  pointer-events: none;
}

.window-layer > * {
  /* 窗口本身恢复事件截获 */
  pointer-events: auto;
}

.taskbar-layer {
  z-index: 9999;
}
</style>
