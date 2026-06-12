import { shallowRef, triggerRef } from 'vue';
import { vfs } from '@/services';

export function useFileSystem() {
  // 提供一个响应式的就绪状态给 UI 提示用（比如 Loading 动画）
  const isReady = shallowRef(false);

  vfs.ready().then(() => {
    isReady.value = true;
    triggerRef(isReady);
    initDefaultStructure();
  });

  // ==================== 默认系统结构生成 ====================
  const initDefaultStructure = async () => {
    const dirs = [
      'C:',
      'C:/Users',
      'C:/Users/Admin',
      'C:/Users/Admin/Desktop',
      'C:/Users/Admin/Documents',
      'C:/Users/Admin/Download',
      'C:/Users/Admin/Pictures',
      'C:/Users/Admin/Music',
      'C:/Users/Admin/Video'
    ];
    for (const d of dirs) {
      if (await vfs.exist(d)) continue;
      await vfs.mkdir(d);
    }
    if (!(await vfs.exist('C:/Users/Admin/Desktop/readme.txt'))) {
      await vfs.writeFile('C:/Users/Admin/Desktop/readme.txt', '欢迎来到 Web OS！');
    }
  };

  /**
   * 封装高频的 UI 读取操作
   */

  /**
   * 监听目录或文件的变化（非常适合供 "资源管理器" 组件使用）
   * @returns unwatch 取消监听函数
   */
  const onFileChange = (path: string, callback: () => void) => {
    const handler = (changedPath: string, event: string) => {
      // 只要发生变化，通知 UI 组件重新拉取数据
      callback();
    };
    vfs.watch(path, handler);
    return () => vfs.unwatch(path, handler);
  };

  return {
    isReady,
    // 暴露核心的路径处理工具供 UI 组件使用
    exist: (p: string) => vfs.exist(p),
    readDirectory: (p: string) => vfs.readDirectory(p),
    readFile: (p: string) => vfs.readFile(p),
    readFileText: (p: string) => vfs.readFileText(p),
    writeFile: (p: string, c: string, m?: string) => vfs.writeFile(p, c, m),
    createDirectory: (p: string) => vfs.mkdir(p),
    normalizePath: (p: string) => vfs.normalizePath(p),
    basename: (p: string) => vfs.basename(p),
    dirname: (p: string) => vfs.dirname(p),
    extname: (p: string) => vfs.extname(p),
    onFileChange
  };
}
