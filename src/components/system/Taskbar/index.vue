<template>
  <div class="taskbar">
    <div class="start-button">
      <img src="/icons.svg" alt="Start" class="start-icon" />
    </div>

    <div class="taskbar-apps">
      <div
        v-for="[pid, process] in store.processes"
        :key="pid"
        class="taskbar-item"
        :class="{ active: process.isActive }"
        @click="sys.focusWindow(pid)"
      >
        <img :src="getAppIcon(process.appId)" class="taskbar-icon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWindowStore } from '../../../store/windows'
import { useSystemManager } from '../../../composables/useSystemManager'
import { appRegistry } from '../../../services/appRegistry'

const store = useWindowStore()
const sys = useSystemManager()

// 获取应用图标
const getAppIcon = (appId: string) => {
  return appRegistry[appId]?.icon || '/favicon.svg'
}
</script>

<style scoped>
.taskbar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 48px;
  background: rgba(243, 243, 243, 0.85);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
.start-button {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}
.start-button:hover {
  background: rgba(255, 255, 255, 0.5);
}
.start-icon {
  width: 24px;
  height: 24px;
}
.taskbar-apps {
  display: flex;
  gap: 4px;
}
.taskbar-item {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.taskbar-item:hover {
  background: rgba(255, 255, 255, 0.5);
}
.taskbar-item.active {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 -3px 0 #0078d4; /* Win11 底部蓝条 */
}
.taskbar-icon {
  width: 24px;
  height: 24px;
}
</style>
