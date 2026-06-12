import { defineStore } from 'pinia';
import type { WindowState } from '@/types/system';

const BASE_Z_INDEX = 100;

export const useWindowStore = defineStore('windows', {
  state: () => ({
    windows: [] as WindowState[],
    activeWindowId: '',
    nextZIndex: BASE_Z_INDEX
  }),

  getters: {
    activeWindow: (state) => state.windows.find((item) => item.id === state.activeWindowId)
  },

  actions: {
    // 内部私有方法：Z-Index 收敛算法，保持层级健康
    _normalizeZIndex() {
      // 按照当前 ZIndex 升序排序
      this.windows.sort((a, b) => a.zIndex - b.zIndex);
      // 重新从 BASE 分配，消除断层和无限递增
      this.windows.forEach((win, index) => {
        win.zIndex = BASE_Z_INDEX + index;
      });
      this.nextZIndex = BASE_Z_INDEX + this.windows.length;
    },

    addWindow(windowState: WindowState) {
      windowState.zIndex = this.nextZIndex++;
      this.windows.push(windowState);
      this.activeWindowId = windowState.id;
    },

    removeWindow(id: string) {
      this.windows = this.windows.filter((item) => item.id !== id);
      if (this.activeWindowId === id) {
        // 寻找最后一个非最小化窗口
        const lastVisibleWindow = this.windows.filter((item) => !item.minimized).pop();
        this.activeWindowId = lastVisibleWindow ? lastVisibleWindow.id : '';
      }
      this._normalizeZIndex(); // 关窗口时顺便清理一下层级碎片
    },

    focusWindow(id: string) {
      const win = this.windows.find((item) => item.id === id);
      if (!win) return;

      // 只有当它不是最高层时，才提升它，减少不必要的重排
      if (win.zIndex < this.nextZIndex - 1) {
        win.zIndex = this.nextZIndex++;
        this._normalizeZIndex(); // 提升后进行归一化
      }

      this.activeWindowId = id;
      win.minimized = false;
    },

    updateWindow(id: string, updates: Partial<WindowState>) {
      const win = this.windows.find((item) => item.id === id);
      if (win) Object.assign(win, updates);
    }
  }
});
