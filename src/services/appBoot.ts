import { useAppStore } from '@/store';

/**
 * 自动扫描并注册所有应用
 */
export async function bootApps() {
  try {
    const appStore = useAppStore();
    // 1. 使用 Vite 的 glob 语法扫描所有 apps 目录下的 index.ts
    // eager: true 表示立即加载模块，不需要异步 await
    const modules = import.meta.glob('@/components/system/**/manifest.ts', { eager: true });

    // 2. 遍历模块并执行注册逻辑
    Object.values(modules).forEach((module: any) => {
      if (module.appInfo) {
        appStore.registerApp(module.appInfo); // 假设每个 index.ts 导出一个 register 函数
      }
    });

    console.log('📦 [OS Kernel] All apps registered.');
  } catch (e) {
    console.error(e);
  }
}
