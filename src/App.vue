<template>
  <DesktopShell />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

// 新增导入
import { DesktopShell } from '@/components';

import { bootIpcDaemon } from './services/ipcDaemon';

// 修改引用路径

// ✅ 显式初始化：在组件挂载后“开机”，此时 DOM 和 Pinia 都已完全准备好
onMounted(() => {
  bootIpcDaemon();
});
</script>

<style>
/* CSS 保持不变 */
body,
html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
