import { useWindowStore } from '../store/windows'
import { appRegistry } from '../services/appRegistry'

export function useSystemManager() {
  const store = useWindowStore()

  // 1. 进程控制
  const openApp = (appId: string, props: Record<string, any> = {}) => {
    const config = appRegistry[appId]
    if (!config) {
      console.error(`App ${appId} not found in registry`)
      return
    }

    const pid = `pid_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    store.highestZIndex++

    const newProcess = {
      pid,
      appId,
      title: config.name,
      x: 100 + (store.processes.size * 30) % 300, // 级联打开偏移
      y: 100 + (store.processes.size * 30) % 300,
      width: config.defaultWidth,
      height: config.defaultHeight,
      zIndex: store.highestZIndex,
      isMinimized: false,
      isMaximized: false,
      isActive: true,
      props
    }

    // 失去其他窗口的焦点
    store.processes.forEach(p => p.isActive = false)
    store.processes.set(pid, newProcess)
    
    return pid
  }

  const closeProcess = (pid: string) => {
    store.processes.delete(pid)
  }

  // 2. 窗口行为控制
  const focusWindow = (pid: string) => {
    const process = store.processes.get(pid)
    if (process && !process.isActive) {
      store.highestZIndex++
      process.zIndex = store.highestZIndex
      store.processes.forEach((p, key) => p.isActive = (key === pid))
      process.isMinimized = false
    }
  }

  const toggleMinimize = (pid: string) => {
    const process = store.processes.get(pid)
    if (process) {
      process.isMinimized = !process.isMinimized
      if (!process.isMinimized) focusWindow(pid)
    }
  }

  const toggleMaximize = (pid: string) => {
    const process = store.processes.get(pid)
    if (process) process.isMaximized = !process.isMaximized
  }

  const updateWindowBounds = (pid: string, x: number, y: number, w?: number, h?: number) => {
    const process = store.processes.get(pid)
    if (process) {
      process.x = x
      process.y = y
      if (w !== undefined) process.width = w
      if (h !== undefined) process.height = h
    }
  }

  return {
    openApp,
    closeProcess,
    focusWindow,
    toggleMinimize,
    toggleMaximize,
    updateWindowBounds
  }
}