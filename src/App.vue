<template>
  <div class="os-container">
    <DesktopShell />
    <Taskbar />
    <ContextMenu />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DesktopShell from './components/system/DesktopShell/index.vue'
import Taskbar from './components/system/Taskbar/index.vue'
import ContextMenu from './components/system/ContextMenu/index.vue'
import { useSystemManager } from './composables/useSystemManager'

const sys = useSystemManager()

onMounted(() => {
  // 系统一启动，立即打开资源管理器！
  sys.openApp('explorer', { path: 'C:/' })
})
</script>

<style>
.os-container {
  width: 100vw;
  height: 100vh;
  background-image: url('./assets/hero.png'); /* 你的Win11壁纸 */
  background-size: cover;
  background-position: center;
  overflow: hidden;
}
/* 隐藏原生右键菜单 */
body {
  margin: 0;
  user-select: none;
}
</style>
