import { useWindowStore } from '@/store'
import { getApp } from '@/services'
import { markRaw } from 'vue'

export function useWindowManager() {
  const windowStore = useWindowStore()

  function openApp(appId: string, options?: { props?: Record<string, any> }) {
    const app = getApp(appId)
    if (!app) {
      console.warn(`[WindowManager] App with ID ${appId} not found in registry.`)
      return
    }

    const existingWindow = windowStore.windows.find((w) => w.appId === appId)
    if (app.single && existingWindow) {
      if (options?.props) {
        windowStore.updateWindow(existingWindow.id, { props: options.props })
      }
      windowStore.focusWindow(existingWindow.id)
      return
    }

    const uniqueWindowId = `win_${appId}_${Date.now()}`

    windowStore.openWindow({
      id: uniqueWindowId,
      appId: app.id,
      title: app.name || app.title || 'Unknown App',
      position: { x: 100, y: 100 },
      size: { width: 800, height: 600 },
      minimized: false,
      maximized: false,
      zIndex: 0,
      component: markRaw(app.component), // ✅ 关键修复：将注册的 Vue 组件传给窗口状态
      props: options?.props // ✅ 将传入的 props 保存到窗口状态中
    })
  }

  return {
    openApp
  }
}
