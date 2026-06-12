<template>
  <div
    class="os-window"
    :class="{
      'is-interacting': isDragging || isResizing,
      'is-maximized': windowState.maximized,
      'is-minimized': windowState.minimized,
      'is-active': isActive,
      'is-fullscreen': windowState.fullscreen
    }"
    :style="windowStyle"
    @mousedown="onFocus"
  >
    <header
      class="window-titlebar"
      @mousedown="startDrag"
      @dblclick="toggleMaximize"
      @contextmenu.prevent="onFocus"
    >
      <div class="titlebar-info">
        <span class="title-icon">{{ appIcon }}</span>
        <span class="title-text">{{ windowState.title }}</span>
      </div>
      <div class="window-controls no-drag">
        <button class="control-btn minimize-btn" title="最小化" @click.stop="toggleMinimize">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 5h8v1H1z" fill="currentColor" />
          </svg>
        </button>
        <button
          class="control-btn maximize-btn"
          :title="windowState.maximized ? '还原' : '最大化'"
          @click.stop="toggleMaximize"
        >
          <svg v-if="!windowState.maximized" width="10" height="10" viewBox="0 0 10 10">
            <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" />
          </svg>
          <svg v-else width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 3H7V8H2V3Z" fill="none" stroke="currentColor" />
            <path d="M3 2H8V7H3V2Z" fill="none" stroke="currentColor" />
          </svg>
        </button>
        <button class="control-btn close-btn" title="关闭" @click.stop="closeWindow">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1l8 8m0-8L1 9" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </button>
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
      <div class="resize-handle top" @mousedown.prevent.stop="startResize($event, 'top')"></div>
      <div class="resize-handle right" @mousedown.prevent.stop="startResize($event, 'right')"></div>
      <div
        class="resize-handle bottom"
        @mousedown.prevent.stop="startResize($event, 'bottom')"
      ></div>
      <div class="resize-handle left" @mousedown.prevent.stop="startResize($event, 'left')"></div>
      <div
        class="resize-handle top-left"
        @mousedown.prevent.stop="startResize($event, 'top-left')"
      ></div>
      <div
        class="resize-handle top-right"
        @mousedown.prevent.stop="startResize($event, 'top-right')"
      ></div>
      <div
        class="resize-handle bottom-left"
        @mousedown.prevent.stop="startResize($event, 'bottom-left')"
      ></div>
      <div
        class="resize-handle bottom-right"
        @mousedown.prevent.stop="startResize($event, 'bottom-right')"
      ></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useWindowInteract, useAppManager } from '@/composables';
import type { WindowState } from '@/types';

const props = defineProps<{ windowState: WindowState }>();
const emit = defineEmits<{
  (event: 'focus', id: string): void;
  (event: 'close', id: string): void;
  (event: 'minimize', id: string): void;
  (event: 'update', id: string, updates: Partial<WindowState>): void;
}>();

// 系统常量配置
const SYSTEM_UI = {
  MIN_WIDTH: 300,
  MIN_HEIGHT: 200,
  TASKBAR_HEIGHT: 48
};

const appManager = useAppManager();

const isActive = computed(() => props.windowState.id === appManager.activeWindowId.value);
const appIcon = computed(() => appManager.getApp(props.windowState.appId)?.icon || '📄');

// 注入交互逻辑复用器
const { isDragging, isResizing, localRect, startDrag, startResize } = useWindowInteract({
  windowState: props.windowState,
  minWidth: SYSTEM_UI.MIN_WIDTH,
  minHeight: SYSTEM_UI.MIN_HEIGHT,
  taskbarHeight: SYSTEM_UI.TASKBAR_HEIGHT,
  onUpdate: (updates) => emit('update', props.windowState.id, updates),
  onFocus: () => emit('focus', props.windowState.id)
});

// 同步外部状态 (仅当非交互状态时)
watch(
  () => props.windowState,
  (newVal) => {
    if (!isDragging.value && !isResizing.value) {
      localRect.value = {
        x: newVal.position.x,
        y: newVal.position.y,
        w: newVal.size.width,
        h: newVal.size.height
      };
    }
  },
  { deep: true }
);

// 样式计算
const windowStyle = computed(() => {
  const baseStyle: Record<string, any> = {
    zIndex: props.windowState.zIndex,
    borderColor: isActive.value ? 'rgba(100, 140, 255, 0.6)' : 'rgba(255, 255, 255, 0.1)'
  };

  if (props.windowState.minimized) {
    return {
      ...baseStyle,
      opacity: 0,
      pointerEvents: 'none',
      transform: 'scale(0.95)'
    };
  }

  if (props.windowState.maximized) {
    return {
      ...baseStyle,
      top: '0px',
      left: '0px',
      width: '100%',
      height: `calc(100% - ${SYSTEM_UI.TASKBAR_HEIGHT}px)`,
      borderRadius: '0px',
      transform: 'none'
    };
  }

  return {
    ...baseStyle,
    transform: `translate(${localRect.value.x}px, ${localRect.value.y}px)`,
    width: `${localRect.value.w}px`,
    height: `${localRect.value.h}px`
  };
});

// 方法派发
const onFocus = () => emit('focus', props.windowState.id);
const closeWindow = () => emit('close', props.windowState.id);
const toggleMinimize = () => emit('minimize', props.windowState.id);
const toggleMaximize = () =>
  emit('update', props.windowState.id, { maximized: !props.windowState.maximized });
</script>

<style scoped>
.os-window {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  background: rgba(30, 30, 30, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  will-change: transform, width, height;
  transition:
    opacity 0.2s,
    transform 0s;
}

.os-window:not(.is-interacting) {
  transition:
    opacity 0.2s,
    transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1),
    width 0.2s,
    height 0.2s;
}

.os-window.is-active {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

.window-titlebar {
  height: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}
.titlebar-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
  font-size: 13px;
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
.title-icon {
  font-size: 14px;
}

.window-controls {
  display: flex;
  height: 100%;
}
.control-btn {
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.1s;
  cursor: default;
}
.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
.close-btn:hover {
  background: #e81123;
  color: #fff;
}

.window-body {
  flex: 1;
  height: 100%;
  overflow: hidden;
  background: #1e1e1e;
}

/* 隐形缩放热区 */
.resize-handle {
  position: absolute;
  z-index: 99;
}
.resize-handle.top {
  top: -4px;
  left: 8px;
  right: 8px;
  height: 8px;
  cursor: ns-resize;
}
.resize-handle.bottom {
  bottom: -4px;
  left: 8px;
  right: 8px;
  height: 8px;
  cursor: ns-resize;
}
.resize-handle.left {
  left: -4px;
  top: 8px;
  bottom: 8px;
  width: 8px;
  cursor: ew-resize;
}
.resize-handle.right {
  right: -4px;
  top: 8px;
  bottom: 8px;
  width: 8px;
  cursor: ew-resize;
}
.resize-handle.top-left {
  top: -4px;
  left: -4px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}
.resize-handle.top-right {
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}
.resize-handle.bottom-left {
  bottom: -4px;
  left: -4px;
  width: 12px;
  height: 12px;
  cursor: nesw-resize;
}
.resize-handle.bottom-right {
  bottom: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
}
</style>
