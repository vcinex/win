<template>
  <div
    class="os-window"
    :class="{
      'is-interacting': isDragging || isResizing,
      'is-maximized': windowState.maximized,
      'is-minimized': windowState.minimized,
      'is-active': windowState.id === windowStore.activeWindowId,
      'is-fullscreen': windowState.fullscreen
    }"
    :style="windowStyle"
    @mousedown="onFocus"
  >
    <header 
      class="window-titlebar" 
      @mousedown="startDrag"
      @dblclick="toggleMaximize"
      @contextmenu="showSystemMenu"
    >
      <span>{{ windowState.title }}</span>
      <div class="window-controls">
        <button 
          type="button" 
          class="control-btn minimize-btn"
          :title="windowState.minimized ? '还原' : '最小化'"
          @click.stop="toggleMinimize"
        >_</button>
        <button 
          type="button" 
          class="control-btn maximize-btn"
          :title="windowState.maximized ? '向下还原' : '最大化'"
          @click.stop="toggleMaximize"
        >
          <svg v-if="!windowState.maximized" width="10" height="10" viewBox="0 0 10 10">
            <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1"/>
          </svg>
          <svg v-else width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 3H7V8H2V3Z" fill="none" stroke="currentColor" stroke-width="1"/>
            <path d="M3 2H8V7H3V2Z" fill="none" stroke="currentColor" stroke-width="1"/>
          </svg>
        </button>
        <button 
          type="button" 
          class="control-btn close-btn"
          title="关闭"
          @click.stop="closeWindow"
        >×</button>
      </div>
    </header>

    <section
      class="window-body"
      :style="{ pointerEvents: isDragging || isResizing ? 'none' : 'auto' }"
    >
      <component 
        :is="windowState.component" 
        :window-id="windowState.id" 
        v-bind="windowState.props" 
      />
    </section>

    <template v-if="!windowState.maximized && !windowState.fullscreen">
      <div class="resize-handle" @mousedown.prevent.stop="startResize"></div>
      <div class="resize-handle-top" @mousedown.prevent.stop="startResizeEdge($event, 'top')"></div>
      <div class="resize-handle-right" @mousedown.prevent.stop="startResizeEdge($event, 'right')"></div>
      <div class="resize-handle-bottom" @mousedown.prevent.stop="startResizeEdge($event, 'bottom')"></div>
      <div class="resize-handle-left" @mousedown.prevent.stop="startResizeEdge($event, 'left')"></div>
      <div class="resize-handle-top-left" @mousedown.prevent.stop="startResizeCorner($event, 'top-left')"></div>
      <div class="resize-handle-top-right" @mousedown.prevent.stop="startResizeCorner($event, 'top-right')"></div>
      <div class="resize-handle-bottom-right" @mousedown.prevent.stop="startResizeCorner($event, 'bottom-right')"></div>
      <div class="resize-handle-bottom-left" @mousedown.prevent.stop="startResizeCorner($event, 'bottom-left')"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useWindowStore } from '@/store'
const windowStore = useWindowStore()
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { WindowState } from '@/types'

// 常量定义，避免魔法数字硬编码
const TITLEBAR_HEIGHT = 36
const MIN_WIDTH = 200
const MIN_HEIGHT = 150

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
const originalSize = ref({ width: 0, height: 0 })
const originalPosition = ref({ x: 0, y: 0 })

// 引用全局事件监听函数，以便正确移除
let currentMoveHandler: ((e: MouseEvent) => void) | null = null
let currentUpHandler: ((e: MouseEvent) => void) | null = null

const windowStyle = computed(() => {
  let style: Record<string, string | number> = {
    zIndex: props.windowState.zIndex,
    opacity: props.windowState.minimized ? 0 : 1,
    pointerEvents: props.windowState.minimized ? 'none' : 'auto',
    display: props.windowState.minimized ? 'none' : 'flex'
  }

  if (props.windowState.maximized) {
    style = {
      ...style,
      top: '0px',
      left: '0px',
      width: '100%',
      height: '100%',
      borderRadius: '0px',
      transform: 'none'
    }
  } else if (props.windowState.fullscreen) {
    style = {
      ...style,
      top: '0px',
      left: '0px',
      width: '100vw',
      height: '100vh',
      borderRadius: '0px',
      transform: 'none',
      border: 'none'
    }
  } else {
    style = {
      ...style,
      transform: `translate(${props.windowState.position.x}px, ${props.windowState.position.y}px)`,
      width: `${props.windowState.size.width}px`,
      height: `${props.windowState.size.height}px`,
      borderRadius: '14px'
    }
  }

  // 边框颜色根据激活状态变化
  style.borderColor = props.windowState.id === windowStore.activeWindowId 
    ? 'rgba(90, 124, 255, 0.8)' 
    : 'rgba(255, 255, 255, 0.08)'

  return style
})

// 获取屏幕边缘吸附位置
const getSnappedPosition = (x: number, y: number) => {
  const screenWidth = window.innerWidth
  const tolerance = 10 // 吸附容差

  let snappedX = x
  let snappedY = y

  // 左边缘吸附
  if (Math.abs(x) < tolerance) snappedX = 0
  // 右边缘吸附
  if (Math.abs(screenWidth - (x + props.windowState.size.width)) < tolerance) {
    snappedX = screenWidth - props.windowState.size.width
  }
  // 顶部吸附
  if (Math.abs(y) < tolerance) snappedY = 0

  return { x: snappedX, y: snappedY }
}

function resetGlobalListeners() {
  if (currentMoveHandler) {
    window.removeEventListener('mousemove', currentMoveHandler)
    currentMoveHandler = null
  }
  if (currentUpHandler) {
    window.removeEventListener('mouseup', currentUpHandler)
    currentUpHandler = null
  }
  document.body.classList.remove('disable-select')
  isDragging.value = false
  isResizing.value = false
}

function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  if (props.windowState.maximized) return // 最大化时不能拖拽

  e.preventDefault()
  e.stopPropagation()

  onFocus()
  isDragging.value = true
  
  document.body.classList.add('disable-select')

  const startX = e.clientX - props.windowState.position.x
  const startY = e.clientY - props.windowState.position.y

  const onMouseMove = (moveEvent: MouseEvent) => {
    // 兼容处理：当鼠标在浏览器外释放后再次进入窗口，如果按键状态改变则强制解除
    if (moveEvent.buttons === 0) {
      resetGlobalListeners()
      return
    }

    moveEvent.preventDefault()
    moveEvent.stopPropagation()
    
    let newX = moveEvent.clientX - startX
    let newY = moveEvent.clientY - startY

    // 边缘吸附
    const snappedPos = getSnappedPosition(newX, newY)
    newX = snappedPos.x
    newY = snappedPos.y

    emit('update', props.windowState.id, {
      position: {
        x: Math.max(0, Math.min(newX, window.innerWidth - props.windowState.size.width)),
        y: Math.max(0, Math.min(newY, window.innerHeight - TITLEBAR_HEIGHT))
      }
    })
  }

  const onMouseUp = (upEvent: MouseEvent) => {
    upEvent.preventDefault()
    resetGlobalListeners()
  }

  currentMoveHandler = onMouseMove
  currentUpHandler = onMouseUp

  window.addEventListener('mousemove', onMouseMove, { passive: false })
  window.addEventListener('mouseup', onMouseUp, { passive: false })
}

// 边缘调整大小
function startResizeEdge(e: MouseEvent, edge: 'top' | 'right' | 'bottom' | 'left') {
  onFocus()
  isResizing.value = true

  const startPos = { x: e.clientX, y: e.clientY }
  const startSize = { ...props.windowState.size }
  const startPosition = { ...props.windowState.position }

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (moveEvent.buttons === 0) {
      resetGlobalListeners()
      return
    }

    const deltaX = moveEvent.clientX - startPos.x
    const deltaY = moveEvent.clientY - startPos.y

    let newWidth = startSize.width
    let newHeight = startSize.height
    let newX = startPosition.x
    let newY = startPosition.y

    switch (edge) {
      case 'top':
        newHeight = Math.max(MIN_HEIGHT, startSize.height - deltaY)
        newY = Math.min(startPosition.y + deltaY, startPosition.y + startSize.height - MIN_HEIGHT)
        break
      case 'right':
        newWidth = Math.max(MIN_WIDTH, startSize.width + deltaX)
        break
      case 'bottom':
        newHeight = Math.max(MIN_HEIGHT, startSize.height + deltaY)
        break
      case 'left':
        newWidth = Math.max(MIN_WIDTH, startSize.width - deltaX)
        newX = Math.min(startPosition.x + deltaX, startPosition.x + startSize.width - MIN_WIDTH)
        break
    }

    emit('update', props.windowState.id, {
      size: {
        width: newWidth,
        height: newHeight
      },
      position: {
        x: newX,
        y: newY
      }
    })
  }

  const onMouseUp = () => {
    resetGlobalListeners()
  }

  currentMoveHandler = onMouseMove
  currentUpHandler = onMouseUp

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// 角落调整大小
function startResizeCorner(e: MouseEvent, corner: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left') {
  onFocus()
  isResizing.value = true

  const startPos = { x: e.clientX, y: e.clientY }
  const startSize = { ...props.windowState.size }
  const startPosition = { ...props.windowState.position }

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (moveEvent.buttons === 0) {
      resetGlobalListeners()
      return
    }

    const deltaX = moveEvent.clientX - startPos.x
    const deltaY = moveEvent.clientY - startPos.y

    let newWidth = startSize.width
    let newHeight = startSize.height
    let newX = startPosition.x
    let newY = startPosition.y

    switch (corner) {
      case 'top-left':
        newWidth = Math.max(MIN_WIDTH, startSize.width - deltaX)
        newHeight = Math.max(MIN_HEIGHT, startSize.height - deltaY)
        newX = Math.min(startPosition.x + deltaX, startPosition.x + startSize.width - MIN_WIDTH)
        newY = Math.min(startPosition.y + deltaY, startPosition.y + startSize.height - MIN_HEIGHT)
        break
      case 'top-right':
        newWidth = Math.max(MIN_WIDTH, startSize.width + deltaX)
        newHeight = Math.max(MIN_HEIGHT, startSize.height - deltaY)
        newY = Math.min(startPosition.y + deltaY, startPosition.y + startSize.height - MIN_HEIGHT)
        break
      case 'bottom-right':
        newWidth = Math.max(MIN_WIDTH, startSize.width + deltaX)
        newHeight = Math.max(MIN_HEIGHT, startSize.height + deltaY)
        break
      case 'bottom-left':
        newWidth = Math.max(MIN_WIDTH, startSize.width - deltaX)
        newHeight = Math.max(MIN_HEIGHT, startSize.height + deltaY)
        newX = Math.min(startPosition.x + deltaX, startPosition.x + startSize.width - MIN_WIDTH)
        break
    }

    emit('update', props.windowState.id, {
      size: {
        width: newWidth,
        height: newHeight
      },
      position: {
        x: newX,
        y: newY
      }
    })
  }

  const onMouseUp = () => {
    resetGlobalListeners()
  }

  currentMoveHandler = onMouseMove
  currentUpHandler = onMouseUp

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// 完整的调整大小功能
function startResize(e: MouseEvent) {
  startResizeCorner(e, 'bottom-right')
}

function onFocus() {
  emit('focus', props.windowState.id)
}

function closeWindow() {
  emit('close', props.windowState.id)
}

function toggleMinimize() {
  if (props.windowState.minimized) {
    emit('update', props.windowState.id, {
      minimized: false
    })
  } else {
    emit('minimize', props.windowState.id)
  }
}

function toggleMaximize() {
  if (props.windowState.maximized) {
    emit('update', props.windowState.id, {
      maximized: false,
      size: originalSize.value,
      position: originalPosition.value
    })
  } else {
    originalSize.value = { ...props.windowState.size }
    originalPosition.value = { ...props.windowState.position }
    
    emit('update', props.windowState.id, {
      maximized: true,
      position: { x: 0, y: 0 },
      size: { 
        width: window.innerWidth, 
        height: window.innerHeight - TITLEBAR_HEIGHT
      }
    })
  }
}

function showSystemMenu(e: MouseEvent) {
  e.preventDefault()
  onFocus()
}

// 键盘快捷键处理
const handleKeyDown = (e: KeyboardEvent) => {
  if (props.windowState.id !== windowStore.activeWindowId) return
  
  if (e.altKey && e.key === ' ') {
    e.preventDefault()
    onFocus()
  }
  
  if (e.ctrlKey && e.altKey && e.key === 'Home') {
    e.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  // 组件卸载时强制清理全局事件和样式
  resetGlobalListeners()
})
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
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.os-window.is-active {
  border-color: rgba(90, 124, 255, 0.8);
  box-shadow: 0 36px 72px rgba(0, 0, 0, 0.45);
}

.os-window:hover:not(.is-maximized) {
  box-shadow: 0 36px 72px rgba(0, 0, 0, 0.45);
}

.os-window.is-interacting {
  transition: none;
}

.os-window.is-maximized {
  border-radius: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.os-window.is-fullscreen {
  border: none;
  border-radius: 0;
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
  user-select: none;
  /* -webkit-app-region: drag; */
}

.window-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 36px;
  height: 28px;
  margin: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #eef2ff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.15s ease;
  -webkit-app-region: no-drag;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.close-btn:hover {
  background: #e81123;
  color: white;
}

.window-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: rgba(8, 12, 22, 0.95);
}

/* 调整大小手柄 */
.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 10;
}

.resize-handle-top {
  position: absolute;
  top: 0;
  left: 8px;
  right: 8px;
  height: 8px;
  cursor: ns-resize;
  z-index: 10;
}

.resize-handle-right {
  position: absolute;
  top: 8px;
  right: 0;
  bottom: 8px;
  width: 8px;
  cursor: ew-resize;
  z-index: 10;
}

.resize-handle-bottom {
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 8px;
  cursor: ns-resize;
  z-index: 10;
}

.resize-handle-left {
  position: absolute;
  top: 8px;
  left: 0;
  bottom: 8px;
  width: 8px;
  cursor: ew-resize;
  z-index: 10;
}

.resize-handle-top-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 10;
}

.resize-handle-top-right {
  position: absolute;
  top: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nesw-resize;
  z-index: 10;
}

.resize-handle-bottom-right {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 10;
}

.resize-handle-bottom-left {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 16px;
  height: 16px;
  cursor: nesw-resize;
  z-index: 10;
}

.disable-select {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  pointer-events: auto; 
}
</style>