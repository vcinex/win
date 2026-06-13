import { defineAsyncComponent, markRaw } from 'vue';

import { getApp } from '@/services';
import { useWindowStore } from '@/store';

import { osBus } from './eventBus';

let count = 0; // 普通模块变量，替代 ref
let isBooted = false; // 防止开发环境热更新重复引导

/**
 * 启动 IPC 守护进程 (必须在 Vue App 挂载后由 App.vue 显式调用)
 */
export function bootIpcDaemon() {
  if (isBooted) return;

  // 此时确保 Pinia 已经挂载
  const windowStore = useWindowStore();

  // 监听：启动应用
  osBus.on('intent:launch_app', async (payload) => {
    const { appId, props } = payload;
    const appDef = getApp(appId);

    if (!appDef) {
      console.error(`[OS Kernel] Application "${appId}" is not registered.`);
      osBus.emit('system:error', {
        source: 'IPC_DAEMON',
        message: `找不到应用 "${appId}" 的注册信息。`,
        code: 404
      });
      return;
    }

    // 1. 原有的单例拦截检查保留
    if (appDef.single) {
      const existingWin = windowStore.windows.find((w) => w.appId === appId);
      if (existingWin) {
        if (props) {
          windowStore.updateWindow(existingWin.id, { props });
        }
        windowStore.focusWindow(existingWin.id);
        return;
      }
    }

    // 2. 生成运行实例 ID
    const pid = `pid_${appId}_${count++}_${Date.now()}`;
    const windowId = `win_${pid}`;

    // 3. 构建异步组件
    const AsyncComp = defineAsyncComponent({
      loader: appDef.component,
      delay: 200,
      timeout: 10000,
      onError(error, retry, fail, attempts) {
        console.error(`[OS Kernel] Failed to load application component: ${appId}`, error);

        // 1. 向系统总线抛出错误广播
        osBus.emit('system:error', {
          source: 'IPC_DAEMON',
          message: `无法启动 "${appDef.name}"。请检查网络连接或应用文件是否损坏。`,
          code: 'APP_LOAD_FAILED'
        });

        // 2. 告诉 Vue 停止重试并宣告失败
        fail();

        // 3. (可选) 如果窗口已经在 Store 里占位了，需要把它清理掉
        windowStore.removeWindow(windowId);
      }
    });

    // 4. 下发指令给 Store
    windowStore.addWindow({
      id: windowId,
      pid: pid,
      appId: appDef.id,
      title: appDef.name || 'Unknown',
      icon: appDef.icon || '📄',
      position: { x: Math.random() * 50 + 100, y: Math.random() * 50 + 100 }, // 错开位置
      size: appDef.defaultSize || { width: 800, height: 600 },
      minimized: false,
      maximized: false,
      fullscreen: false,
      zIndex: 0,
      component: markRaw(AsyncComp),
      props: props
    });
  });

  // 监听：其他窗口生命周期操作
  osBus.on('intent:close_window', (p) => windowStore.removeWindow(p.windowId));
  osBus.on('intent:minimize_window', (p) => windowStore.minimizeWindow(p.windowId));
  osBus.on('intent:maximize_window', (p) => windowStore.maximizeWindow(p.windowId));
  osBus.on('intent:toggle_maximize_window', (p) => windowStore.toggleMaximizeWindow(p.windowId));
  osBus.on('intent:focus_window', (p) => windowStore.focusWindow(p.windowId));
  osBus.on('intent:update_window', (p) => windowStore.updateWindow(p.windowId, p.updates));

  isBooted = true;
  console.log('🚀 [OS Kernel] IPC Daemon booted successfully.');
}
