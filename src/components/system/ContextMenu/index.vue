<template>
  <Teleport to="body">
    <div
      v-if="ctx.state.visible"
      class="global-context-menu"
      :style="{ top: `${ctx.state.y}px`, left: `${ctx.state.x}px` }"
      @click.stop
    >
      <div
        v-for="(item, index) in ctx.state.items"
        :key="index"
        class="menu-item"
        :class="{ divided: item.divided, disabled: item.disabled }"
        @click="handleItemClick(item)"
      >
        {{ item.label }}
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useContextMenu } from '../../../composables/useContextMenu'

const ctx = useContextMenu()

const handleItemClick = (item: any) => {
  if (item.disabled) return
  if (item.action) item.action()
  ctx.hideMenu()
}

// 点击任意空白处关闭菜单
onMounted(() => window.addEventListener('click', ctx.hideMenu))
onUnmounted(() => window.removeEventListener('click', ctx.hideMenu))
</script>

<style scoped>
.global-context-menu {
  position: fixed;
  z-index: 99999; /* 必须极高 */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 4px;
  min-width: 150px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
.menu-item {
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 4px;
  cursor: default;
}
.menu-item:hover:not(.disabled) {
  background: rgba(0, 0, 0, 0.05);
}
.menu-item.divided {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 4px;
  padding-bottom: 4px;
}
.menu-item.disabled {
  color: #999;
}
</style>
