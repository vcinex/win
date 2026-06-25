<template>
  <main
    class="desktop-shell"
    @contextmenu.prevent="showDesktopMenu"
    @click="osBus.emit('system:desktop_click')"
  >
    <div class="desktop-background"></div>

    <div class="window-layer">
      <Window
        v-for="windowState in windowStates"
        :key="windowState.id"
        :window-state="windowState"
      />
    </div>

    <Taskbar class="taskbar-layer" />
    <NotificationCenter />
  </main>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useShortcut, useSystemEvent } from '@/composables';
import { osBus } from '@/services';
import { useWindowStore } from '@/store';

import NotificationCenter from './NotificationCenter.vue';
import Taskbar from './Taskbar.vue';
import Window from './Window.vue';

const windowStore = useWindowStore();
const { windowStates } = storeToRefs(windowStore);

const showDesktopMenu = (e: MouseEvent) => {
  console.log('Desktop right click triggered at', e.clientX, e.clientY);
  osBus.emit('system:toast', {
    source: 'DesktopShell',
    message: '点击了右键'
  });
};

const handleSystemIntent = (intentPayload: { action: string; appId: string; payload: any }) => {
  const { action, appId, payload } = intentPayload;
  if (action === 'OPEN_FILE' && appId) {
    osBus.emit('intent:launch_app', { appId, props: payload });
  }
};

useSystemEvent('system:os-intent', handleSystemIntent);

// ✅ 接收全局桌面点击事件，关闭所有层级的弹窗菜单
useSystemEvent('system:desktop_click', () => {
  osBus.emit('intent:closeAllPopups', null);
});

// 1. 注册全局系统快捷键：Alt + Tab 切换窗口
useShortcut(
  'alt+tab',
  () => {
    // osBus.emit('intent:cycle_windows');
  },
  { scope: 'global', priority: 999 }
); // 系统级给予高优先级

// 2. 注册全局系统快捷键：Win + D 返回桌面
useShortcut(
  'meta+d',
  () => {
    // osBus.emit('intent:toggle_desktop');
  },
  { scope: 'global', priority: 999 }
);

// 3. ✅ 注册全局系统快捷键：Esc 关闭顶层菜单
useShortcut(
  'escape',
  () => {
    osBus.emit('intent:closeTopPopup', null);
  },
  { scope: 'global', priority: 500 }
);
</script>

<style scoped>
.desktop-shell {
  position: fixed;
  inset: 0;
  overflow: hidden;
  user-select: none;
  background-color: #000; /* Fallback fallback */
}

.desktop-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  /* 现代默认壁纸风格替代，未来可改为图片 */
  background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%);
  background-size: cover;
  background-position: center;
}

.window-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  /* 极其关键：让事件穿透到下层桌面，否则无法点右键和拖拽图标 */
  pointer-events: none;
}

.window-layer > * {
  /* 窗口本身恢复事件截获 */
  pointer-events: auto;
}

.taskbar-layer {
  z-index: 9999;
}
</style>
