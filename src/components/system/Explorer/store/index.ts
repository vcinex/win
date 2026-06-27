import { reactive, computed, provide, inject } from 'vue';

export const ExplorerStoreSymbol = Symbol('ExplorerStore');

export function createExplorerStore() {
  const state = reactive({
    history: ['C:/Users/Admin'] as string[],
    historyIndex: 0
  });

  // === 派生状态 ===
  const currentPath = computed(() => state.history[state.historyIndex] ?? '');
  const pathSegments = computed(() => {
    const path = state.history[state.historyIndex] ?? '';
    return path.split('/').filter((s) => s.trim() !== '');
  });

  const canGoBack = computed(() => state.historyIndex > 0);
  const canGoForward = computed(() => state.historyIndex < state.history.length - 1);

  // === 导航方法 ===
  function goBack() {
    if (canGoBack.value) state.historyIndex--;
  }

  function goForward() {
    if (canGoForward.value) state.historyIndex++;
  }

  function pushPath(path: string) {
    if (currentPath.value === path) return;
    state.history.splice(state.historyIndex + 1);
    state.history.push(path);
    state.historyIndex = state.history.length - 1;
  }

  function jumpToHistory(index: number) {
    if (index >= 0 && index < state.history.length) {
      state.historyIndex = index;
    }
  }

  const store = {
    state,
    currentPath,
    pathSegments,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    pushPath,
    jumpToHistory
  };

  // 依赖注入：如果有深层子组件需要该状态，可以通过 inject(ExplorerStoreSymbol) 无缝共享
  provide(ExplorerStoreSymbol, store);

  return store;
}

// 可选：提供给子组件接入最近一层局部 Store 使用
export function useExplorerStore() {
  const store = inject(ExplorerStoreSymbol);
  if (!store) {
    throw new Error('useExplorerStore 必须在 Explorer 实例组件树内使用');
  }
  return store as ReturnType<typeof createExplorerStore>;
}
