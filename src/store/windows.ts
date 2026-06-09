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
      windowState.active = true
      this.windows.forEach((item) => (item.active = item.id === windowState.id ? true : false))
      this.windows.push(windowState)
      this.activeWindowId = windowState.id
      this.startMenuOpen = false
    },
    closeWindow(id: string) {
      this.windows = this.windows.filter((item) => item.id !== id)
      if (this.activeWindowId === id) {
        this.activeWindowId = this.windows.length ? this.windows[this.windows.length - 1].id : ''
      }
    },
    focusWindow(id: string) {
      const win = this.windows.find((item) => item.id === id)
      if (!win) return
      this.windows.forEach((item) => (item.active = item.id === id))
      win.zIndex = this.nextZIndex++
      this.activeWindowId = id
    },
    minimizeWindow(id: string) {
      const win = this.windows.find((item) => item.id === id)
      if (!win) return
      win.minimized = true
      if (this.activeWindowId === id) {
        this.activeWindowId = this.windows.filter((item) => !item.minimized).pop()?.id ?? ''
      }
    },
    toggleStartMenu() {
      this.startMenuOpen = !this.startMenuOpen
    }
  }
})
