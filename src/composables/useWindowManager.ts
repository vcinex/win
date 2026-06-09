import { useWindowStore } from '../store/windows'
import { getApp } from '../services/appRegistry'

export function useWindowManager() {
  const windowStore = useWindowStore()

  function openApp(appId: string) {
    const app = getApp(appId)
    if (!app) {
      console.warn(`[WindowManager] App with ID ${appId} not found in registry.`)
      return
    }

    const existingWindow = windowStore.windows.find(w => w.appId === appId)
    if (existingWindow) {
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
      component: app.component // ✅ 关键修复：将注册的 Vue 组件传给窗口状态
    })
  }

  return { 
    openApp 
  }
}