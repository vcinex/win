// 1. 定义系统中所有的 Intent (跨进程通信事件) 及其严格的 Payload 参数类型
export type SystemIntents = {
  // --- 1. IPC 指令 (应用请求系统做事) ---
  'intent:launch_app': { appId: string; props?: Record<string, any> };
  'intent:close_window': { windowId: string };
  'intent:minimize_window': { windowId: string };
  'intent:maximize_window': { windowId: string };

  // --- 2. 系统广播 (系统通知所有应用/组件) ---
  'system:desktop_click': void; // 桌面被点击，各组件应收起自己的下拉/弹出菜单
  'system:theme_changed': { theme: 'light' | 'dark' };

  // --- 3. VFS 文件系统事件 (未来的扩展) ---
  'vfs:file_changed': { path: string; type: 'create' | 'delete' | 'update' };
};
