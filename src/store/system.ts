import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

export const useSystemStore = defineStore('system', () => {
  // 维护一个活动的弹窗标识栈，用于 Z-Index 堆叠和按顺序关闭
  const popupStack = ref<string[]>([]);

  // 快捷计算属性：开始菜单是否处于打开状态
  const isStartMenuOpen = computed(() => popupStack.value.includes('start-menu'));

  // 切换指定弹窗状态
  function togglePopup(popupId: string) {
    const index = popupStack.value.indexOf(popupId);
    if (index > -1) {
      popupStack.value.splice(index, 1);
    } else {
      // 打开新弹窗时推入栈顶
      popupStack.value.push(popupId);
    }
  }

  // 关闭栈顶最上层的弹窗（用于 ESC 快捷键）
  function closeTopPopup() {
    if (popupStack.value.length > 0) {
      popupStack.value.pop();
    }
  }

  // 强制清空所有系统层弹窗（用于点击桌面空白处）
  function closeAllPopups() {
    popupStack.value = [];
  }

  return {
    popupStack,
    isStartMenuOpen,
    togglePopup,
    closeTopPopup,
    closeAllPopups
  };
});
