<template>
  <div
    class="os-window"
    :class="{ 'is-interacting': isDragging || isResizing }"
    :style="windowStyle"
    @mousedown="onFocus"
  >
    <header class="window-titlebar" @mousedown="startDrag">
      <span>{{ windowState.title }}</span>
      <div class="window-controls">
        <button type="button" @click.stop="minimizeWindow">_</button>
        <button type="button" @click.stop="closeWindow">×</button>
      </div>
    </header>

    <section
      class="window-body"
      :style="{ pointerEvents: isDragging || isResizing ? 'none' : 'auto' }"
    >
      <component :is="windowState.component" :window-id="windowState.id" />
    </section>

    <div class="resize-handle" @mousedown.prevent.stop="startResize"></div>
  </div>
</template>

<script setup lang="ts">
import { useWindowStore } from '@/store'
const windowStore = useWindowStore()
import { computed, ref } from 'vue'
import type { WindowState } from '@/types'

const props = defineProps<{
  windowState: WindowState
}>()

const emit = defineEmits<{
  (event: 'focus', id: string): void
  (event: 'close', id: string): void
  (event: 'minimize', id: string): void
  (event: 'update', id: string, updates: Partial<WindowState>): void
}>()

const isDragging = ref(false)
const isResizing = ref(false)

// 将 windowStyle 中的 minimize 改为 minimized，并且可以增加 display 控制
const windowStyle = computed(() => ({
  zIndex: props.windowState.zIndex,
  transform: `translate(${props.windowState.position.x}px, ${props.windowState.position.y}px)`,
  width: `${props.windowState.size.width}px`,
  height: `${props.windowState.size.height}px`,
  // ✅ 修复：直接用 id 和 store 中的 activeWindowId 对比判断是否激活
  borderColor:
    props.windowState.id === windowStore.activeWindowId ? '#5a7cff' : 'rgba(255,255,255,0.1)',
  opacity: props.windowState.minimized ? 0 : 1,
  pointerEvents: props.windowState.minimized ? 'none' : 'auto',
  display: props.windowState.minimized ? 'none' : 'flex'
}))

function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  onFocus()
  isDragging.value = true

  const startX = e.clientX - props.windowState.position.x
  const startY = e.clientY - props.windowState.position.y

  const onMouseMove = (moveEvent: MouseEvent) => {
    emit('update', props.windowState.id, {
      position: {
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      }
    })
  }

  const onMouseUp = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function startResize(e: MouseEvent) {
  onFocus()
  isResizing.value = true

  const startX = e.clientX
  const startY = e.clientY
  const startW = props.windowState.size.width
  const startH = props.windowState.size.height

  const onMouseMove = (moveEvent: MouseEvent) => {
    emit('update', props.windowState.id, {
      size: {
        width: Math.max(200, startW + (moveEvent.clientX - startX)),
        height: Math.max(150, startH + (moveEvent.clientY - startY))
      }
    })
  }

  const onMouseUp = () => {
    isResizing.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onFocus() {
  emit('focus', props.windowState.id)
}

function closeWindow() {
  emit('close', props.windowState.id)
}

function minimizeWindow() {
  emit('minimize', props.windowState.id)
}
</script>

<style scoped>
.os-window {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  background: rgba(18, 24, 42, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(16px);
  transition: box-shadow 0.2s ease;
}

.os-window:hover {
  box-shadow: 0 36px 72px rgba(0, 0, 0, 0.45);
}

.window-titlebar {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: rgba(10, 14, 26, 0.94);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #eef2ff;
  cursor: default;
  font-size: 13px;
}

.window-controls button {
  width: 28px;
  height: 28px;
  margin-left: 6px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  cursor: pointer;
}

.window-controls button:hover {
  background: rgba(255, 255, 255, 0.12);
}

.window-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: rgba(8, 12, 22, 0.95);
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 10;
}
</style>
