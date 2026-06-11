<template>
  <div
    v-show="!process.isMinimized"
    class="window-container"
    :class="{ active: process.isActive, maximized: process.isMaximized }"
    :style="windowStyle"
    @mousedown="focus"
  >
    <div class="title-bar" @mousedown.self="startDrag" @dblclick="toggleMaximize">
      <div class="title-info">
        <img v-if="appConfig" :src="appConfig.icon" class="title-icon" />
        <span class="title-text">{{ process.title }}</span>
      </div>
      <div class="window-controls">
        <button class="ctrl-btn minimize" @click.stop="sys.toggleMinimize(pid)">一</button>
        <button class="ctrl-btn maximize" @click.stop="sys.toggleMaximize(pid)">口</button>
        <button class="ctrl-btn close" @click.stop="sys.closeProcess(pid)">X</button>
      </div>
    </div>

    <div class="window-content">
      <component :is="appConfig.component" v-if="appConfig" :pid="pid" v-bind="process.props" />
    </div>

    <div
      v-if="!process.isMaximized"
      class="resize-handle"
      @mousedown.stop.prevent="startResize"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWindowStore } from '../../../store/windows'
import { useSystemManager } from '../../../composables/useSystemManager'
import { appRegistry } from '../../../services/appRegistry'

const props = defineProps<{ pid: string }>()
const store = useWindowStore()
const sys = useSystemManager()

const process = computed(() => store.processes.get(props.pid)!)
const appConfig = computed(() => appRegistry[process.value.appId])

const windowStyle = computed(() => {
  if (process.value.isMaximized) {
    return {
      top: 0,
      left: 0,
      width: '100%',
      height: 'calc(100vh - 48px)',
      zIndex: process.value.zIndex
    }
  }
  return {
    top: `${process.value.y}px`,
    left: `${process.value.x}px`,
    width: `${process.value.width}px`,
    height: `${process.value.height}px`,
    zIndex: process.value.zIndex
  }
})

const focus = () => sys.focusWindow(props.pid)
const toggleMaximize = () => sys.toggleMaximize(props.pid)

// 拖拽逻辑
const startDrag = (e: MouseEvent) => {
  if (process.value?.isMaximized) return
  focus()
  const startX = e.clientX - process.value.x
  const startY = e.clientY - process.value.y

  const onMouseMove = (moveEvent: MouseEvent) => {
    sys.updateWindowBounds(props.pid, moveEvent.clientX - startX, moveEvent.clientY - startY)
  }
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 缩放逻辑
const startResize = (e: MouseEvent) => {
  focus()
  const startW = process.value.width
  const startH = process.value.height
  const startX = e.clientX
  const startY = e.clientY

  const onMouseMove = (moveEvent: MouseEvent) => {
    sys.updateWindowBounds(
      props.pid,
      process.value.x,
      process.value.y,
      startW + (moveEvent.clientX - startX),
      startH + (moveEvent.clientY - startY)
    )
  }
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style scoped>
.window-container {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}
.window-container.active {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.2);
}
.window-container.maximized {
  border-radius: 0;
  transition: all 0.2s ease-out;
}
.title-bar {
  height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f3f3f3;
  user-select: none;
}
.window-container.active .title-bar {
  background: #ffffff;
}
.title-info {
  display: flex;
  align-items: center;
  padding-left: 10px;
  pointer-events: none;
}
.title-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}
.title-text {
  font-size: 12px;
  color: #333;
}
.window-controls {
  display: flex;
  height: 100%;
}
.ctrl-btn {
  width: 46px;
  border: none;
  background: transparent;
  transition: 0.1s;
  cursor: pointer;
}
.ctrl-btn:hover {
  background: #e5e5e5;
}
.ctrl-btn.close:hover {
  background: #e81123;
  color: white;
}
.window-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  cursor: nwse-resize;
}
</style>
