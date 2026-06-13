import { defineStore } from 'pinia';

import type { WindowState } from '@/types';

const BASE_Z_INDEX = 100;

export const useWindowStore = defineStore('windows', {
  state: () => ({
    windowStates: [] as WindowState[],
    histories: [] as string[],
    activeWindowId: '',
    nextZIndex: BASE_Z_INDEX
  }),

  getters: {
    activeWindow: (state) => state.windowStates.find((item) => item.id === state.activeWindowId)
  },

  actions: {
    // 内部私有方法：Z-Index 收敛算法，保持层级健康
    // 暂时先不用
    _normalizeZIndex() {
      // 按照当前 ZIndex 升序排序
      this.windowStates.sort((a, b) => a.zIndex - b.zIndex);
      // 重新从 BASE 分配，消除断层和无限递增
      this.windowStates.forEach((win, index) => {
        win.zIndex = BASE_Z_INDEX + index;
      });
      this.nextZIndex = BASE_Z_INDEX + this.windowStates.length;
    },

    findWindow(id: string) {
      return this.windowStates.find((item) => item.id === id);
    },

    addWindow(windowState: WindowState) {
      windowState.zIndex = this.nextZIndex++;
      this.windowStates.push(windowState);
      this.activeWindowId = windowState.id;
    },

    removeWindow(id: string) {
      this.windowStates = this.windowStates.filter((item) => item.id !== id);
      this.histories = this.histories.filter((historyId) => historyId !== id);

      // 从 histories（历史栈）末尾向前寻找第一个未最小化的窗口激活
      let index = this.histories.length - 1;
      for (; index >= 0; index--) {
        const historyId = this.histories[index];
        const win = this.findWindow(historyId);
        if (!win) {
          this.histories.splice(index, 1);
        } else {
          if (!win.minimized) {
            this.activeWindowId = win.id;
            break;
          }
        }
      }
      if (index === -1) {
        this.activeWindowId = '';
      }
    },

    focusWindow(id: string) {
      const win = this.windowStates.find((item) => item.id === id);
      if (!win) return;

      // 1. Z-Index 逻辑：只有当它不是最高层时，才提升它，减少不必要的重排
      if (win.zIndex < this.nextZIndex - 1) {
        win.zIndex = this.nextZIndex++;
      }

      const historyIndex = this.histories.findIndex((historyId) => historyId === id);
      if (historyIndex !== -1) {
        this.histories.splice(historyIndex, 1);
      }
      this.histories.push(win.id);

      this.activeWindowId = id;
      win.minimized = false;
    },

    updateWindow(id: string, updates: Partial<WindowState>) {
      const win = this.windowStates.find((item) => item.id === id);
      if (win) Object.assign(win, updates);
    },

    minimizeWindow(id: string) {
      const win = this.windowStates.find((item) => item.id === id);
      if (win) {
        win.minimized = true;
        win.maximized = false;
        // 最小化后，从 histories 栈中移除当前窗口，并将会话转移到前一个最高层级的未最小化窗口
        const historyIndex = this.histories.findIndex((hId) => hId === id);
        if (historyIndex !== -1) {
          this.histories.splice(historyIndex, 1);
        }

        // 重新寻找并激活上一个窗口
        if (this.activeWindowId === id) {
          const lastValidId = this.histories.reverse().find((hId) => {
            const w = this.findWindow(hId);
            return w && !w.minimized;
          });
          this.activeWindowId = lastValidId || '';
        }
      }
    },

    toggleMaximizeWindow(id: string) {
      const win = this.windowStates.find((item) => item.id === id);
      if (win) {
        if (win.maximized) {
          win.maximized = false;
        } else {
          win.maximized = true;
        }
        this.focusWindow(id);
      }
    },

    maximizeWindow(id: string) {
      const win = this.windowStates.find((item) => item.id === id);
      if (win) {
        win.maximized = true;
        this.focusWindow(id);
      }
    }
  }
});
