import { computed, defineAsyncComponent, markRaw } from 'vue';
import { useWindowStore } from '@/store';
import { registerApp, getApp, listApps } from '@/services';
import { WindowState } from '@/types';

export function useAppManager() {
  const windowStore = useWindowStore();

  let count = 0;

  /**
   * 核心 API：启动或聚焦应用
   */
  async function launchApp(appId: string, options?: Record<string, any>) {
    const appDef = getApp(appId);
    if (!appDef) {
      console.error(`[OS Kernel] Application "${appId}" is not registered.`);
      return;
    }

    // 1. 单例拦截检查
    if (appDef.single) {
      const existingWin = windowStore.windows.find((w) => w.appId === appId);
      if (existingWin) {
        // 如果是单例且已打开，更新 props 并置顶
        if (options?.props) {
          windowStore.updateWindow(existingWin.id, { props: options.props });
        }
        windowStore.focusWindow(existingWin.id);
        return;
      }
    }

    // 2. 生成运行实例 ID
    const pid = `pid_${appId}_${count++}_${Date.now()}`;
    const windowId = `win_${pid}`; // 目前 1 PID 对应 1 Window，留出扩展空间

    // 3. 构建异步组件 (结合 Suspense 可实现 Loading)
    const AsyncComp = defineAsyncComponent({
      loader: appDef.component,
      // loadingComponent: LoadingSpinner, // 可选：配置系统统一的 Loading 圈
      // errorComponent: ErrorScreen,      // 可选：配置蓝屏/错误提示
      delay: 200,
      timeout: 10000
    });

    // 4. 下发指令给 Store 画出窗口
    windowStore.addWindow({
      id: windowId,
      pid: pid,
      appId: appDef.id,
      title: appDef.name || 'Unknown',
      position: { x: Math.random() * 50 + 100, y: Math.random() * 50 + 100 }, // 错开位置
      size: appDef.defaultSize || { width: 800, height: 600 },
      minimized: false,
      maximized: false,
      fullscreen: false,
      zIndex: 0, // addWindow 会自动接管
      component: markRaw(AsyncComp), // ✅ 极其重要：使用 markRaw 阻止 Vue 代理组件对象本身
      props: options?.props
    });
  }

  /**
   * 系统 API：关闭窗口
   */
  function closeWindow(windowId: string) {
    windowStore.removeWindow(windowId);
  }
  function focusWindow(windowId: string) {
    windowStore.focusWindow(windowId);
  }
  function minimizeWindow(windowId: string) {
    windowStore.focusWindow(windowId);
  }
  function updateWindow(windowId: string, updates: Partial<WindowState>) {
    windowStore.focusWindow(windowId);
  }

  return {
    launchApp,
    closeWindow,
    focusWindow,
    minimizeWindow,
    updateWindow,
    activeWindowId: computed(() => {
      return windowStore.activeWindowId;
    }),
    windows: computed(() => {
      return windowStore.windows;
    }),
    registerApp: registerApp,
    getApp: getApp,
    listApps: listApps
  };
}
