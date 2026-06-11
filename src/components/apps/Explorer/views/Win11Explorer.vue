<template>
  <div class="win11-explorer">
    <AddressBar />
    <CommandBar />

    <div class="main-body">
      <Sidebar />
      <MainContent />
    </div>

    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import AddressBar from './AddressBar.vue'
import CommandBar from './CommandBar.vue'
import Sidebar from './Sidebar.vue'
import MainContent from './MainContent.vue'
import StatusBar from './StatusBar.vue'

// 接收系统调度器传来的进程 ID
const props = defineProps<{ pid?: string }>()

// ==========================================
// 🚨 重点：请删掉以前所有的 useWindowStore、useWindowManager
// 以及处理外框拖拽、最大化、最小化的业务逻辑。
// 下方只保留你原来处理文件、右键菜单、路径导航的内部业务逻辑即可。
// ==========================================
</script>

<style scoped>
.win11-explorer {
  /* 填满外部的 Window 容器 */
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  /* 🚨 删掉了 position: absolute 和由于旧拖拽逻辑产生的动态宽高 */
}

.main-body {
  display: flex;
  flex: 1;
  overflow: hidden; /* 防止内部文件列表撑爆容器 */
}
</style>
