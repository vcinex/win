<template>
  <footer class="taskbar">
    <button class="start-button" @click="toggleStartMenu">Start</button>

    <div class="taskbar-windows">
      <button v-for="windowState in openWindows" :key="windowState.id" class="taskbar-item"
        :class="{ active: windowState.id === windowStore.activeWindowId }" @click="focusWindow(windowState.id)">
        >
      </button>
    </div>

    <div v-if="showStartMenu" class="start-menu">
      <div class="menu-title">Applications</div>
      <button v-for="app in apps" :key="app.id" class="start-menu-item" @click="openApp(app.id)">
        {{ app.title }}
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useWindowManager } from '../composables/useWindowManager'
import { listApps } from '../services/appRegistry'
import { useWindowStore } from '../store/windows'

const windowStore = useWindowStore()
const { openApp, focusWindow, toggleStartMenu } = useWindowManager()
const apps = listApps()
const openWindows = computed(() => windowStore.windows)
const showStartMenu = computed(() => windowStore.startMenuOpen)
</script>

<style scoped>
.taskbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  background: rgba(12, 18, 32, 0.9);
  backdrop-filter: blur(10px);
}

.start-button {
  min-width: 80px;
  padding: 0 12px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #2d3a6a;
  color: #fff;
  cursor: pointer;
}

.taskbar-windows {
  flex: 1;
  display: flex;
  gap: 6px;
  overflow-x: auto;
}

.taskbar-item {
  padding: 0 10px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
}

.taskbar-item.active {
  background: rgba(255, 255, 255, 0.16);
}

.start-menu {
  position: absolute;
  bottom: 56px;
  left: 12px;
  width: 220px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(10, 14, 26, 0.96);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

.menu-title {
  margin-bottom: 8px;
  color: #8fa2d2;
  font-size: 12px;
  text-transform: uppercase;
}

.start-menu-item {
  width: 100%;
  margin-bottom: 6px;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  text-align: left;
  cursor: pointer;
}
</style>
