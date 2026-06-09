import { defineStore } from 'pinia'
import type { WindowState } from '../types/system'

export const useWindowStore = defineStore('windows', {
  state: () => ({
    windows: [] as WindowState[],
    activeWindowId: '',
    nextZIndex: 100,
    startMenuOpen: false
  }),
  getters: {
    activeWindow: (state) => state.windows.find((item) => item.id === state.activeWindowId)
  },
  actions: {
    openWindow(windowState: WindowState) {
      windowState.zIndex = this.nextZIndex++
      this.windows.push(windowState)
      this.activeWindowId = windowState.id
      this.startMenuOpen = false
    },
    closeWindow(id: string) {
      this.windows = this.windows.filter((item) => item.id !== id)
      if (this.activeWindowId === id) {
        // 寻找最后一个没有被最小化的窗口
        const lastVisibleWindow = this.windows.filter((item) => !item.minimized).pop()
        this.activeWindowId = lastVisibleWindow ? lastVisibleWindow.id : ''
      }
    },
    focusWindow(id: string) {
      const win = this.windows.find((item) => item.id === id)
      if (!win) return
      win.zIndex = this.nextZIndex++
      this.activeWindowId = id
      win.minimized = false // 建议加上这行：如果聚焦了一个最小化的窗口，自动恢复显示
    },
    minimizeWindow(id: string) {
      const win = this.windows.find((item) => item.id === id)
      if (!win) return
      win.minimized = true
      if (this.activeWindowId === id) {
        this.activeWindowId = this.windows.filter((item) => !item.minimized).pop()?.id ?? ''
      }
    },
    // 在 actions 中添加:
    updateWindow(id: string, updates: Partial<WindowState>) {
      const win = this.windows.find((item) => item.id === id)
      if (win) {
        Object.assign(win, updates)
      }
    },
    toggleStartMenu() {
      this.startMenuOpen = !this.startMenuOpen
    }
  }
})
