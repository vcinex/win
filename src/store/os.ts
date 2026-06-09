import { defineStore } from 'pinia'
import { useWindowStore } from './windows'

// 定义应用的基本属性
export interface AppDef {
  id: string
  name: string
  icon: string
  content: string
}

// 定义运行中窗口的状态
export interface WindowState {
  instanceId: number
  appId: string
  title: string
  content: string
  x: number
  y: number
  zIndex: number
  isMinimized: boolean
}

// 定义 Store 的 State 结构
interface OsState {
  apps: AppDef[]
  activeWindows: WindowState[]
  zIndexCounter: number
  isStartMenuOpen: boolean
}

export const useOsStore = defineStore('os', {
  state: (): OsState => ({
    apps: [
      { id: 'browser', name: '浏览器', icon: '🌐', content: '这是一个浏览器应用' },
      { id: 'terminal', name: '终端', icon: '💻', content: 'C:\\Users\\Vue> _' },
      { id: 'folder', name: '我的电脑', icon: '📁', content: '本地磁盘 (C:)' }
    ],
    activeWindows: [],
    zIndexCounter: 100,
    isStartMenuOpen: false
  }),

  actions: {
    openApp(app: AppDef) {
      const existingWindow = this.activeWindows.find((w) => w.appId === app.id)
      if (existingWindow) {
        existingWindow.isMinimized = false
        this.focusWindow(existingWindow.instanceId)
        return
      }

      this.activeWindows.push({
        instanceId: Date.now(),
        appId: app.id,
        title: app.name,
        content: app.content,
        x: 100 + this.activeWindows.length * 30,
        y: 100 + this.activeWindows.length * 30,
        zIndex: this.zIndexCounter++,
        isMinimized: false
      })
    },

    closeWindow(instanceId: number) {
      this.activeWindows = this.activeWindows.filter((w) => w.instanceId !== instanceId)
    },

    focusWindow(instanceId: number) {
      const win = this.activeWindows.find((w) => w.instanceId === instanceId)
      if (win) {
        win.zIndex = this.zIndexCounter++
        win.isMinimized = false
      }
    },

    toggleMinimize(instanceId: number) {
      const win = this.activeWindows.find((w) => w.instanceId === instanceId)
      if (win) win.isMinimized = !win.isMinimized
    }
  }
})

// 聚合导出 windowStore，避免重复/冲突引用
export { useWindowStore }
