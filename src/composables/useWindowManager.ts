import { useWindowStore } from '../store/windows'
import { getApp } from '../services/appRegistry'

export function useWindowManager() {
  const windowStore = useWindowStore()

  function openApp(appId: string) {
    const app = getApp(appId)
    if (!app) return
    const id = `${app.id}-${Date.now()}`
    windowStore.openWindow({
      id,
      appId: app.id,
      title: app.title,
      zIndex: 0,
      position: { x: 120, y: 120 },
      size: app.defaultSize ?? { width: 800, height: 600 },
      minimized: false,
      maximized: false,
      active: false,
      component: app.component
    })
  }

  return {
    openApp,
    focusWindow: windowStore.focusWindow,
    closeWindow: windowStore.closeWindow,
    minimizeWindow: windowStore.minimizeWindow,
    toggleStartMenu: windowStore.toggleStartMenu
  }
}
