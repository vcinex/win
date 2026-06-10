<template>
  <DesktopShell />
</template>

<script setup lang="ts">
import { DesktopShell } from '@/components'
</script>

<style>
body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* 防止桌面出现意外的浏览器滚动条 */
}
</style>