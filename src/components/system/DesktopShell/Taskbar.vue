<template>
  <footer class="win11-taskbar" @click.stop>
    <div class="taskbar-center">
      <button
        class="taskbar-icon start-btn"
        :class="{ 'is-open': startMenuOpen }"
        @click.stop="toggleStartMenu"
      >
        <svg viewBox="0 0 88 88" width="24" height="24">
          <path
            fill="#00a4ef"
            d="M0 12.4L37.6 7v33H0zM41.6 6.4L88 0v40H41.6zM0 43.6h37.6v33.4L0 71.6zM41.6 43.6H88v40.4L41.6 77.5z"
          />
        </svg>
      </button>

      <button
        v-for="win in openWindows"
        :key="win.id"
        class="taskbar-icon app-btn"
        :class="{ active: win.id === appManager.activeWindowId.value && !win.minimized }"
        :title="win.title"
        @click="handleTaskbarClick(win)"
      >
        <span class="fallback-icon">{{ getAppIcon(win.appId) }}</span>
        <div :class="['indicator', { min: win.minimized }]"></div>
      </button>
    </div>

    <StartMenu :is-open="startMenuOpen" @close="startMenuOpen = false" />
  </footer>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import StartMenu from './StartMenu.vue';
import { useAppManager } from '@/composables';
import type { WindowState } from '@/types';

let startMenuOpen: boolean = false;

const appManager = useAppManager();
const openWindows = appManager.windows;

const getAppIcon = (appId: string) => appManager.getApp(appId)?.icon || '📄';

function toggleStartMenu() {
  startMenuOpen = !startMenuOpen;
}

function handleTaskbarClick(win: WindowState) {
  startMenuOpen = false;
  if (appManager.activeWindowId.value === win.id && !win.minimized) {
    appManager.minimizeWindow(win.id);
  } else {
    appManager.focusWindow(win.id);
  }
}

// 点击空白处关闭开始菜单
const closeMenuOnOutsideClick = () => {
  if (startMenuOpen) startMenuOpen = false;
};

onMounted(() => window.addEventListener('click', closeMenuOnOutsideClick));
onUnmounted(() => window.removeEventListener('click', closeMenuOnOutsideClick));
</script>

<style scoped>
.win11-taskbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: rgba(243, 243, 243, 0.85);
  backdrop-filter: blur(25px) saturate(1.5);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  justify-content: center;
  z-index: 9999;
}

@media (prefers-color-scheme: dark) {
  .win11-taskbar {
    background: rgba(32, 32, 32, 0.85);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
}

.taskbar-center {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 100%;
}

.taskbar-icon {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: none;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition:
    background 0.2s,
    transform 0.1s;
}

.taskbar-icon:hover {
  background: rgba(255, 255, 255, 0.8);
}
@media (prefers-color-scheme: dark) {
  .taskbar-icon:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.taskbar-icon:active {
  transform: scale(0.92);
}

.fallback-icon {
  font-size: 22px;
}

.indicator {
  position: absolute;
  bottom: 2px;
  width: 16px;
  height: 3px;
  background: #0067c0;
  border-radius: 2px;
  transition: width 0.2s;
}
.indicator.min {
  width: 6px;
  background: #888;
}
.taskbar-icon.active .indicator {
  width: 24px;
}
</style>
