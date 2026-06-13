<template>
  <footer class="win11-taskbar" @click.stop>
    <div class="taskbar-center">
      <button
        class="taskbar-icon start-btn"
        :class="{ 'is-open': isSartMenuOpen }"
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
        v-for="windowState in windowStates"
        :key="windowState.id"
        class="taskbar-icon app-btn"
        :class="{ active: windowState.id === activeWindowId && !windowState.minimized }"
        :title="windowState.title"
        @click="handleTaskbarClick(windowState)"
      >
        <span class="fallback-icon">{{ windowState.icon }}</span>
        <div :class="['indicator', { min: windowState.minimized }]"></div>
      </button>
    </div>
    <StartMenu :is-open="isSartMenuOpen" @close="isSartMenuOpen = false" />
  </footer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { storeToRefs } from 'pinia';

import { useSystemEvent } from '@/composables/useEventBus.js';
import { osBus } from '@/services';
import { useWindowStore } from '@/store';
import type { WindowState } from '@/types';

// ✅ 用于结构响应式数据
import StartMenu from './StartMenu.vue';

let isSartMenuOpen = ref<boolean>(false);

// 【读操作】：直接从 Pinia 取状态并建立响应式绑定
const windowStore = useWindowStore();
const { windowStates, activeWindowId } = storeToRefs(windowStore);

function toggleStartMenu() {
  isSartMenuOpen.value = !isSartMenuOpen.value;
}

function handleTaskbarClick(windowState: WindowState) {
  isSartMenuOpen.value = false;
  // 【写操作】：只发送意图，怎么最小化、怎么聚焦是 Daemon 的事
  if (activeWindowId.value === windowState.id && !windowState.minimized) {
    osBus.emit('intent:minimize_window', { windowId: windowState.id });
  } else {
    osBus.emit('intent:focus_window', { windowId: windowState.id });
  }
}

// 原有的点击空白处关闭逻辑保持不动
const closeMenuOnOutsideClick = () => {
  if (isSartMenuOpen.value) isSartMenuOpen.value = false;
};

onMounted(() => useSystemEvent('system:desktop_click', closeMenuOnOutsideClick));
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
