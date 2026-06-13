<template>
  <footer class="win11-taskbar">
    <div class="taskbar-center">
      <button
        ref="startBtnRef"
        class="taskbar-icon start-btn"
        :class="{ 'is-open': isSartMenuOpen }"
        @click="toggleStartMenu"
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

    <StartMenu ref="startMenuRef" :is-open="isSartMenuOpen" @close="isSartMenuOpen = false" />
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { onClickOutside } from '@vueuse/core';
import { storeToRefs } from 'pinia';

import { osBus } from '@/services';
import { useWindowStore } from '@/store';
import type { WindowState } from '@/types';

import StartMenu from './StartMenu.vue';

let isSartMenuOpen = ref<boolean>(false);

const windowStore = useWindowStore();
const { windowStates, activeWindowId } = storeToRefs(windowStore);

// DOM Refs 用于 onClickOutside 绑定
const startBtnRef = ref<HTMLElement | null>(null);
const startMenuRef = ref<InstanceType<typeof StartMenu> | null>(null);

function toggleStartMenu() {
  isSartMenuOpen.value = !isSartMenuOpen.value;
}

function handleTaskbarClick(windowState: WindowState) {
  isSartMenuOpen.value = false;
  if (activeWindowId.value === windowState.id && !windowState.minimized) {
    osBus.emit('intent:minimize_window', { windowId: windowState.id });
  } else {
    osBus.emit('intent:focus_window', { windowId: windowState.id });
  }
}

// ✅ 核心优化：使用 onClickOutside 替代原本脆弱的全局事件监听
onClickOutside(
  () => (startMenuRef.value as any)?.$el,
  () => {
    if (isSartMenuOpen.value) {
      isSartMenuOpen.value = false;
    }
  },
  { ignore: [startBtnRef] } // 忽略对开始按钮本身的点击，交由 toggleStartMenu 处理
);
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
