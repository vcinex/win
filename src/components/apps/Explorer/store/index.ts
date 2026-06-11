import { defineStore } from 'pinia'

export const useExplorerStore = defineStore('explorer', {
  state: () => ({
    history: ['C:/Users/Admin'] as string[],
    historyIndex: 0
  }),

  getters: {
    // 当前激活路径
    currentPath: (state): string => {
      return state.history[state.historyIndex] ?? ''
    },
    // 路径分段（C:/Users/Admin → ['C:','Users','Admin']）
    pathSegments: (state): string[] => {
      const path = state.history[state.historyIndex] ?? ''
      return path.split('/').filter((s) => s.trim() !== '')
    },
    // 是否可以后退
    canGoBack: (state): boolean => state.historyIndex > 0,
    // 是否可以前进
    canGoForward: (state): boolean => state.historyIndex < state.history.length - 1
  },

  actions: {
    // 后退
    goBack() {
      if (this.canGoBack) {
        this.historyIndex--
      }
    },

    // 前进
    goForward() {
      if (this.canGoForward) {
        this.historyIndex++
      }
    },

    // 推入新路径，截断后方历史（浏览器地址栏逻辑）
    pushPath(path: string) {
      // 截断当前索引之后的历史
      this.history.splice(this.historyIndex + 1)
      this.history.push(path)
      this.historyIndex = this.history.length - 1
    },

    // 直接跳转历史内某一条（点击历史记录）
    jumpToHistory(index: number) {
      if (index >= 0 && index < this.history.length) {
        this.historyIndex = index
      }
    }
  }
})
