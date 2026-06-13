// 窗口与应用生命周期意图
export type WindowIntents = {
  'intent:launch_app': { appId: string; props?: Record<string, any> };
  'intent:close_window': { windowId: string };
  'intent:minimize_window': { windowId: string };
  'intent:maximize_window': { windowId: string };
  'intent:toggle_maximize_window': { windowId: string };
  'intent:focus_window': { windowId: string };
  'intent:update_window': { windowId: string; updates: Record<string, any> };
};

// 系统级广播意图
export type SystemBroadcastIntents = {
  'system:desktop_click': void;
  'system:theme_change': { theme: 'dark' | 'light' };
};

// 组合所有的 Intents，方便后续扩展
export type SystemIntents = WindowIntents & SystemBroadcastIntents;
