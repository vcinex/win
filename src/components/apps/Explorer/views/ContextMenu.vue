<template>
  <Teleport to="body">
    <div
      v-if="contextMenu.visible"
      ref="menuRef"
      class="win11-context-menu"
      :style="{ top: `${adjustedY}px`, left: `${adjustedX}px` }"
      @click.stop
      @contextmenu.prevent
    >
      <div v-if="contextMenu.targetItem">
        <div class="menu-item" @click="$emit('handle-item-open', contextMenu.targetItem)">
          <span class="icon">📂</span>
          打开
        </div>
        <div class="menu-separator"></div>
        <div class="menu-item" @click="$emit('handle-cut')">
          <span class="icon">✂️</span>
          剪切 (Ctrl+X)
        </div>
        <div class="menu-item" @click="$emit('handle-copy')">
          <span class="icon">📄</span>
          复制 (Ctrl+C)
        </div>
        <div class="menu-item" @click="$emit('handle-rename-selected')">
          <span class="icon">📝</span>
          重命名 (F2)
        </div>
        <div class="menu-item" @click="$emit('handle-delete-selected')">
          <span class="icon">🗑️</span>
          删除 (Del)
        </div>
        <div class="menu-separator"></div>
        <div class="menu-item" @click="$emit('show-properties', contextMenu.targetItem)">
          <span class="icon">ℹ️</span>
          属性
        </div>
      </div>
      <div v-else>
        <div
          class="menu-item"
          :class="{ disabled: !clipboard }"
          @click="clipboard && $emit('handle-paste')"
        >
          <span class="icon">📋</span>
          粘贴 (Ctrl+V)
        </div>
        <div class="menu-separator"></div>
        <div class="menu-item" @click="$emit('handle-new-folder')">
          <span class="icon">📁</span>
          新建文件夹
        </div>
        <div class="menu-item" @click="$emit('handle-new-file')">
          <span class="icon">📄</span>
          新建文本文档
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  contextMenu: { visible: boolean; x: number; y: number; targetItem: any | null }
  clipboard: any | null
}>()

defineEmits([
  'handle-item-open',
  'handle-cut',
  'handle-copy',
  'handle-rename-selected',
  'handle-delete-selected',
  'handle-paste',
  'handle-new-folder',
  'handle-new-file',
  'show-properties'
])

const menuRef = ref<HTMLElement | null>(null)
const adjustedX = ref(0)
const adjustedY = ref(0)

// 监听菜单显示，计算防越界坐标
watch(
  () => props.contextMenu.visible,
  async (isVisible) => {
    if (isVisible) {
      adjustedX.value = props.contextMenu.x
      adjustedY.value = props.contextMenu.y
      await nextTick()
      if (menuRef.value) {
        const rect = menuRef.value.getBoundingClientRect()
        const winWidth = window.innerWidth
        const winHeight = window.innerHeight
        if (adjustedX.value + rect.width > winWidth) adjustedX.value -= rect.width
        if (adjustedY.value + rect.height > winHeight) adjustedY.value -= rect.height
      }
    }
  }
)
</script>

<style scoped>
.win11-context-menu {
  position: fixed;
  z-index: 99999;
  background: rgba(243, 243, 243, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 4px;
  min-width: 200px;
  font-size: 12px;
  color: #202020;
}
.menu-item {
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.menu-item:hover:not(.disabled) {
  background: rgba(0, 0, 0, 0.05);
}
.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.menu-separator {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 4px 0;
}
</style>
