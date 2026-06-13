// src/composables/useShortcuts.ts
import { onMounted, onUnmounted, ref } from 'vue';

import { useWindowStore } from '@/store';

// 引入你的窗口Store

interface ShortcutOptions {
  scope?: 'global' | string; // 'global' 代表全局，字符串代表特定的 appId
  priority?: number; // 优先级，数字越大越先匹配
  preventDefault?: boolean; // 是否阻止浏览器默认行为
}

interface ShortcutRegistry {
  id: string;
  combo: string; // 规范化后的组合键字符串，如 "ctrl+s", "alt+tab"
  handler: (e: KeyboardEvent) => void;
  options: ShortcutOptions;
}

// 全局注册表（放在函数外部，确保全局单例）
const shortcutRegistry = ref<ShortcutRegistry[]>([]);

/**
 * 辅助函数：将 KeyboardEvent 转换为规范化的字符串格式 (如 "ctrl+alt+t")
 */
function getEventComboString(e: KeyboardEvent): string {
  const keys: string[] = [];
  if (e.ctrlKey) keys.push('ctrl');
  if (e.altKey) keys.push('alt');
  if (e.shiftKey) keys.push('shift');
  if (e.metaKey) keys.push('meta'); // Windows 键 / Command 键

  const primaryKey = e.key.toLowerCase();
  // 排除单独按下的修饰键本身
  if (!['control', 'alt', 'shift', 'meta'].includes(primaryKey)) {
    keys.push(primaryKey);
  }

  return keys.join('+');
}

/**
 * 全局唯一的键盘事件核心处理器
 */
function handleGlobalKeydown(e: KeyboardEvent) {
  const windowStore = useWindowStore();
  const activeAppId = windowStore.activeWindowId; // 获取当前置顶/激活的 App ID
  const currentCombo = getEventComboString(e);

  if (!currentCombo) return;

  // 1. 过滤出当前环境下可用的快捷键（全局，或者属于当前激活 App 的快捷键）
  const availableShortcuts = shortcutRegistry.value.filter((item) => {
    const scope = item.options.scope || 'global';
    return scope === 'global' || scope === activeAppId;
  });

  // 2. 严格匹配当前的组合键
  const matchedShortcuts = availableShortcuts.filter((item) => item.combo === currentCombo);

  if (matchedShortcuts.length === 0) return;

  // 3. 按优先级降序排序，执行优先级最高的一个
  matchedShortcuts.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));
  const target = matchedShortcuts[0];

  // 4. 执行逻辑
  if (target.options.preventDefault) {
    e.preventDefault();
  }

  target.handler(e);
}

// 确保全局只挂载一个 window 监听器
let isListenerMounted = false;
function ensureGlobalListener() {
  if (isListenerMounted) return;
  // 使用 capture: true (捕获阶段) 确保系统级快捷键拥有最高优先判定权
  window.addEventListener('keydown', handleGlobalKeydown, { capture: true });
  isListenerMounted = true;
}

/**
 * 外部调用的 Composable 接口
 */
export function useShortcut(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {}
) {
  // 规范化输入的组合键，允许用户输入 "Ctrl + S" 或 "ctrl+s"
  const normalizedCombo = combo.toLowerCase().replace(/\s+/g, '');
  const id = Math.random().toString(36).substring(2, 9);

  // 默认配置
  const fullOptions: ShortcutOptions = {
    scope: 'global',
    priority: 0,
    preventDefault: true,
    ...options
  };

  onMounted(() => {
    ensureGlobalListener();
    // 注册到表中
    shortcutRegistry.value.push({
      id,
      combo: normalizedCombo,
      handler,
      options: fullOptions
    });
  });

  onUnmounted(() => {
    // 自动销毁，防止内存泄漏和路由/窗口切换后的快捷键残留
    shortcutRegistry.value = shortcutRegistry.value.filter((item) => item.id !== id);
  });
}
