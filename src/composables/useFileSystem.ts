import { shallowRef, triggerRef } from 'vue';

import { vfs } from '@/services';
import { FSItem, FileMetadata, TrashItem } from '@/types';

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
      'C:/Users/Admin/Downloads', // 优化：拼写规范化为 Downloads
      'C:/Users/Admin/Pictures',
      'C:/Users/Admin/Music',
      'C:/Users/Admin/Videos' // 优化：拼写规范化为 Videos
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
    onFileChange,

    // 1. 元数据与属性管理 (配合 FileMetadata 和 FSItem)
    /** 获取文件/目录详细状态信息 */
    stat: (p: string): Promise<FileMetadata> => vfs.stat(p),
    /** 修改文件属性 (隐藏、只读、锁定等) */
    setAttribute: (p: string, attrs: Partial<Pick<FSItem, 'hidden' | 'readOnly' | 'locked'>>) =>
      vfs.setAttribute(p, attrs),
    /** 修改权限 (类 POSIX) */
    chmod: (p: string, permissions: number) => vfs.chmod(p, permissions),

    // 2. 文件与目录流转 (实现剪切、复制、粘贴的基础)
    /** 重命名或移动文件/目录 (剪切机制) */
    rename: (oldPath: string, newPath: string) => vfs.rename(oldPath, newPath),
    /** 复制文件 */
    copyFile: (srcPath: string, destPath: string) => vfs.copyFile(srcPath, destPath),
    /** 复制目录 (包含内部所有子文件) */
    copyDirectory: (srcPath: string, destPath: string) => vfs.copyDirectory(srcPath, destPath),

    // 3. 删除与回收站机制 (配合 TrashItem)
    /** 将文件/目录移入回收站 */
    moveToTrash: (p: string) => vfs.moveToTrash(p),
    /** 永久删除文件 */
    unlink: (p: string) => vfs.unlink(p),
    /** 永久删除目录 (recursive 控制是否级联删除子文件) */
    rmdir: (p: string, recursive = false) => vfs.rmdir(p, recursive),
    /** 获取回收站列表 */
    getTrashItems: (): Promise<TrashItem[]> => vfs.getTrashItems(),
    /** 恢复回收站文件 */
    restoreFromTrash: (originalPath: string) => vfs.restoreFromTrash(originalPath),
    /** 清空回收站 */
    emptyTrash: () => vfs.emptyTrash(),

    // 4. 快捷方式与链接 (配合 FSType 中的 'symlink')
    /** 创建快捷方式 (软链接) */
    createSymlink: (targetPath: string, linkPath: string) =>
      vfs.createSymlink(targetPath, linkPath),

    // 5. 聚合与高级搜索
    /** 搜索指定目录下的文件 */
    search: (keyword: string, dirPath = 'C:'): Promise<FileMetadata[]> =>
      vfs.search(keyword, dirPath)
  };
}
