<template>
  <DesktopShell />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import DesktopShell from '@/components/system/DesktopShell/index.vue';
import { bootApps, bootIpcDaemon } from '@/services';

// ✅ 显式初始化：在组件挂载后“开机”，此时 DOM 和 Pinia 都已完全准备好
onMounted(() => {
  bootIpcDaemon();
  bootApps();
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
