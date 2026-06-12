import type { AppDefinition } from '@/types';

const registry = new Map<string, AppDefinition>();

export function registerApp(app: AppDefinition) {
  if (!app.id) return;
  registry.set(app.id, app);
}

export function getApp(id: string): AppDefinition | undefined {
  return registry.get(id);
}

export function listApps(): AppDefinition[] {
  return Array.from(registry.values());
}

// ✅ 注册时使用动态 import，打包时会自动代码分割(Code Splitting)
// registerApp({
//   id: 'text-editor',
//   name: '文本编辑器',
//   icon: '📝',
//   component: () => import('@/components/apps/TextEditor/index.vue'),
//   defaultSize: { width: 900, height: 600 },
//   single: false
// });

// registerApp({
//   id: 'file-explorer',
//   name: '资源管理器',
//   icon: '📁',
//   component: () => import('@/components/apps/Explorer/views/Win11Explorer.vue'),
//   defaultSize: { width: 850, height: 550 },
//   single: false
// });
