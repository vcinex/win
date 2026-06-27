// src/services/vfs.ts
import type { FSItem, FileMetadata, TrashItem } from '@/types';

const IDB_NAME = 'vfs_opfs_db';
const IDB_STORE = 'metadata';
const IDB_TRASH = 'trash';

const mimeTypes: Record<string, string> = {
  txt: 'text/plain',
  html: 'text/html',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  mp4: 'video/mp4'
};

type WatchCallback = (path: string, event: 'create' | 'write' | 'delete' | 'rename') => void;

export class VirtualFileSystem {
  // 优化 1：放弃 Vue 深度响应式，使用原生 Map，内存开销极低
  private files = new Map<string, FSItem>();
  private trash = new Map<string, TrashItem>();

  // 优化 2：空间换时间，建立目录索引，让 readDirectory 的时间复杂度降为 O(1)
  private dirIndex = new Map<string, Set<string>>();

  private watches = new Map<string, Set<WatchCallback>>();
  private idb: IDBDatabase | null = null;
  private opfsRoot: FileSystemDirectoryHandle | null = null;

  // 优化 3：使用单例 Promise 替代 while(true) 危险轮询
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.ready(); // 自动触发初始化
  }

  // ==================== 核心：初始化与状态机 ====================
  public ready(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    return this.initPromise;
  }

  private async initialize(): Promise<void> {
    this.idb = await this.initIdb();
    this.opfsRoot = await this.initOpfs();
    await this.loadMetadata();
  }

  // ==================== 核心：安全与路径处理 ====================
  // 优化 4：严格路径解析，防止路径穿越攻击 (Path Traversal)
  public normalizePath(path: string): string {
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (stack.length > 0) stack.pop(); // 防止越过根目录
      } else {
        stack.push(part);
      }
    }
    return stack.join('/');
  }

  public dirname(path: string): string {
    const parts = this.normalizePath(path).split('/');
    parts.pop();
    return parts.join('/');
  }

  public basename(path: string): string {
    return this.normalizePath(path).split('/').pop() || '';
  }

  public extname(path: string): string {
    const baseName = this.normalizePath(path).split('/').pop() || '';
    return baseName.split('.').pop() || '';
  }

  public extractMimeType(path: string): string {
    const ext = this.extname(path).toLocaleLowerCase();
    return mimeTypes[ext] || '';
  }

  // ==================== 核心：内存索引管理 (O(1) 读取引擎) ====================
  private updateIndex(path: string, type: 'add' | 'remove') {
    const parentDir = this.dirname(path);
    const name = this.basename(path);

    if (!this.dirIndex.has(parentDir)) {
      this.dirIndex.set(parentDir, new Set());
    }

    if (type === 'add') {
      this.dirIndex.get(parentDir)!.add(name);
    } else {
      this.dirIndex.get(parentDir)!.delete(name);
      // 清理空索引
      if (this.dirIndex.get(parentDir)!.size === 0) {
        this.dirIndex.delete(parentDir);
      }
    }
  }

  // ==================== 底层：持久化存储驱动 ====================
  private initIdb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE))
          db.createObjectStore(IDB_STORE, { keyPath: 'path' });
        if (!db.objectStoreNames.contains(IDB_TRASH))
          db.createObjectStore(IDB_TRASH, { keyPath: 'path' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async initOpfs() {
    let isPersisted = await navigator.storage.persisted();
    if (!isPersisted) isPersisted = await navigator.storage.persist();
    if (!isPersisted) console.warn('[VFS] 警告：持久化存储未授权，数据可能被浏览器清理');
    return await navigator.storage.getDirectory();
  }

  private async loadMetadata() {
    if (!this.idb) return;
    const tx = this.idb.transaction([IDB_STORE, IDB_TRASH], 'readonly');

    // 加载文件元数据并建立树状索引
    const filesReq = tx.objectStore(IDB_STORE).getAll();
    filesReq.onsuccess = () => {
      filesReq.result.forEach((item) => {
        this.files.set(item.path, item.data);
        this.updateIndex(item.path, 'add');
      });
    };

    const trashReq = tx.objectStore(IDB_TRASH).getAll();
    trashReq.onsuccess = () => {
      trashReq.result.forEach((item) => this.trash.set(item.path, item.data));
    };

    return new Promise((resolve) => (tx.oncomplete = resolve));
  }

  private async saveMetadata(path: string, data: FSItem) {
    if (!this.idb) return;
    const tx = this.idb.transaction(IDB_STORE, 'readwrite');
    await tx.objectStore(IDB_STORE).put({ path, data });
  }

  // >>>>> 新增辅助驱动方法 >>>>>
  private async deleteMetadata(path: string) {
    if (!this.idb) return;
    const tx = this.idb.transaction(IDB_STORE, 'readwrite');
    await tx.objectStore(IDB_STORE).delete(path);
  }

  private async getOpfsDirHandle(dirPath: string, create = false) {
    let handle = this.opfsRoot!;
    if (!dirPath) return handle;
    const parts = dirPath.split('/').filter(Boolean);
    for (const p of parts) {
      handle = await handle.getDirectoryHandle(p, { create });
    }
    return handle;
  }
  // <<<<< 新增辅助驱动方法 <<<<<

  // ==================== 文件系统操作 API ====================
  public async readDirectory(dirPath: string): Promise<FileMetadata[]> {
    await this.ready();
    const normalizedDir = this.normalizePath(dirPath);
    // 高效读取：直接命中 Set 缓存，时间复杂度 O(1)
    const childNames = this.dirIndex.get(normalizedDir);
    if (!childNames) return [];

    const result: FileMetadata[] = [];
    for (const name of childNames) {
      const fullPath = normalizedDir ? `${normalizedDir}/${name}` : name;
      const item = this.files.get(fullPath);
      if (item) {
        result.push({
          name,
          path: fullPath,
          size: item.size,
          mtime: item.mtime,
          type: item.type,
          hidden: item.hidden,
          readOnly: item.readOnly,
          mimeType: item.type != 'directory' ? item.mimeType : ''
        });
      }
    }
    return result;
  }

  public async writeFile(
    rawPath: string,
    content: FileSystemWriteChunkType,
    mimeType?: string
  ): Promise<void> {
    await this.ready();
    const path = this.normalizePath(rawPath);
    const existing = this.files.get(path);

    if (existing?.readOnly) throw new Error('EPERM: 文件只读');
    if (existing?.locked) throw new Error('ELOCKED: 文件被锁定');

    // 1. 稳健地计算数据体积
    let size = 0;
    if (typeof content === 'string') size = new TextEncoder().encode(content).length;
    else if (content instanceof Blob) size = content.size;
    else if (content instanceof ArrayBuffer) size = content.byteLength;
    else if (ArrayBuffer.isView(content)) size = content.byteLength;

    if (!mimeType) {
      mimeType = this.extractMimeType(path);
      if (content instanceof Blob) {
        mimeType = content.type;
      }
    }

    // 2. 获取 OPFS 句柄并处理并发锁
    const dirHandle = await this.getOpfsDirHandle(this.dirname(path), true);
    const fileHandle = await dirHandle.getFileHandle(this.basename(path), { create: true });

    try {
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error: any) {
      if (error.name === 'NoModificationAllowedError' || error.name === 'InvalidStateError') {
        throw new Error('EBUSY: 文件正在被其他进程占用');
      }
      throw error;
    }

    // 3. 更新元数据与索引 (保证 OPFS 写入成功后再写 IDB，防止数据不一致)
    const item: FSItem = {
      type: 'file',
      mtime: Date.now(),
      size,
      hidden: existing?.hidden ?? false,
      readOnly: existing?.readOnly ?? false,
      permissions: existing?.permissions ?? 0o644,
      locked: false,
      mimeType: mimeType
    };

    this.files.set(path, item);
    this.updateIndex(path, 'add');
    await this.saveMetadata(path, item);
    this.emitEvent(path, existing ? 'write' : 'create');
  }

  public async readFile(rawPath: string): Promise<File> {
    await this.ready();
    const path = this.normalizePath(rawPath);
    const item = this.files.get(path);

    if (!item) throw new Error('ENOENT: 文件不存在');
    if (item.type !== 'file') throw new Error('EISDIR: 是一个目录');

    const dirHandle = await this.getOpfsDirHandle(this.dirname(path));
    const fileHandle = await dirHandle.getFileHandle(this.basename(path));
    return await fileHandle.getFile();
  }

  public async readFileText(rawPath: string): Promise<string> {
    const file = await this.readFile(rawPath);
    return await file.text();
  }

  public async mkdir(rawPath: string): Promise<void> {
    await this.ready();
    const path = this.normalizePath(rawPath);
    if (this.files.has(path)) throw new Error('EEXIST: 目录已存在');

    const item: FSItem = {
      type: 'directory',
      mtime: Date.now(),
      size: 0,
      permissions: 0o755,
      mimeType: ''
    };

    this.files.set(path, item);
    this.updateIndex(path, 'add');
    await this.saveMetadata(path, item);
    this.emitEvent(path, 'create');
  }

  public async exist(rawPath: string): Promise<boolean> {
    await this.ready();
    return this.files.has(this.normalizePath(rawPath));
  }

  // ==================== ⬇️ 补全的现代化文件系统接口 ⬇️ ====================

  /** 获取文件元数据 */
  public async stat(rawPath: string): Promise<FileMetadata> {
    await this.ready();
    const path = this.normalizePath(rawPath);
    const item = this.files.get(path);
    if (!item) throw new Error(`ENOENT: ${path} 不存在`);
    return {
      name: this.basename(path),
      path,
      size: item.size,
      mtime: item.mtime,
      type: item.type,
      hidden: item.hidden,
      readOnly: item.readOnly,
      permissions: item.permissions,
      mimeType: item.mimeType
    };
  }

  /** 修改文件属性 */
  public async setAttribute(
    rawPath: string,
    attrs: Partial<Pick<FSItem, 'hidden' | 'readOnly' | 'locked'>>
  ): Promise<void> {
    await this.ready();
    const path = this.normalizePath(rawPath);
    const item = this.files.get(path);
    if (!item) throw new Error('ENOENT: 文件不存在');
    Object.assign(item, attrs);
    await this.saveMetadata(path, item);
    this.emitEvent(path, 'write');
  }

  /** 修改文件权限 */
  public async chmod(rawPath: string, permissions: number): Promise<void> {
    await this.ready();
    const path = this.normalizePath(rawPath);
    const item = this.files.get(path);
    if (!item) throw new Error('ENOENT: 文件不存在');
    item.permissions = permissions;
    await this.saveMetadata(path, item);
    this.emitEvent(path, 'write');
  }

  /** 永久删除文件 (或软链接) */
  public async unlink(rawPath: string): Promise<void> {
    await this.ready();
    const path = this.normalizePath(rawPath);
    const item = this.files.get(path);
    if (!item) throw new Error('ENOENT: 文件不存在');
    if (item.type === 'directory')
      throw new Error('EISDIR: 不能通过 unlink 删除目录，请使用 rmdir');

    // 真实文件需要删除底层 OPFS
    if (item.type === 'file') {
      try {
        const dirHandle = await this.getOpfsDirHandle(this.dirname(path));
        await dirHandle.removeEntry(this.basename(path));
      } catch (e) {
        console.warn('[VFS] OPFS底层文件清理失败:', e);
      }
    }

    this.files.delete(path);
    this.updateIndex(path, 'remove');
    await this.deleteMetadata(path);
    this.emitEvent(path, 'delete');
  }

  /** 删除目录 */
  public async rmdir(rawPath: string, recursive = false): Promise<void> {
    await this.ready();
    const path = this.normalizePath(rawPath);
    const item = this.files.get(path);
    if (!item) throw new Error('ENOENT: 目录不存在');
    if (item.type !== 'directory') throw new Error('ENOTDIR: 不是一个目录');

    const children = this.dirIndex.get(path);
    if (children && children.size > 0) {
      if (!recursive) throw new Error('ENOTEMPTY: 目录不为空');
      // 级联删除子文件
      for (const child of children) {
        const childPath = `${path}/${child}`;
        const childItem = this.files.get(childPath);
        if (childItem?.type === 'directory') await this.rmdir(childPath, true);
        else await this.unlink(childPath);
      }
    }

    try {
      const dirHandle = await this.getOpfsDirHandle(this.dirname(path));
      await dirHandle.removeEntry(this.basename(path), { recursive: true });
    } catch (e) {
      console.warn('[VFS] OPFS底层目录清理失败:', e);
    }

    this.files.delete(path);
    this.updateIndex(path, 'remove');
    await this.deleteMetadata(path);
    this.emitEvent(path, 'delete');
  }

  /** 复制文件 */
  public async copyFile(srcRaw: string, destRaw: string): Promise<void> {
    const src = this.normalizePath(srcRaw);
    const dest = this.normalizePath(destRaw);
    const item = this.files.get(src);
    if (!item || item.type !== 'file') throw new Error('ENOENT: 源文件无效');

    const file = await this.readFile(src);
    await this.writeFile(dest, file, item.mimeType);
  }

  /** 复制目录及内容 */
  public async copyDirectory(srcRaw: string, destRaw: string): Promise<void> {
    const src = this.normalizePath(srcRaw);
    const dest = this.normalizePath(destRaw);
    const item = this.files.get(src);
    if (!item || item.type !== 'directory') throw new Error('ENOENT: 源目录无效');

    await this.mkdir(dest);
    const children = this.dirIndex.get(src);
    if (children) {
      for (const child of children) {
        const childSrc = `${src}/${child}`;
        const childDest = `${dest}/${child}`;
        const childItem = this.files.get(childSrc);
        if (childItem?.type === 'directory') await this.copyDirectory(childSrc, childDest);
        else if (childItem?.type === 'file') await this.copyFile(childSrc, childDest);
      }
    }
  }

  /** 重命名 / 移动文件或目录 (Move/Cut) */
  public async rename(oldRaw: string, newRaw: string): Promise<void> {
    const oldPath = this.normalizePath(oldRaw);
    const newPath = this.normalizePath(newRaw);
    if (oldPath === newPath) return;

    const item = this.files.get(oldPath);
    if (!item) throw new Error('ENOENT: 源路径不存在');
    if (this.files.has(newPath)) throw new Error('EEXIST: 目标路径已存在');

    if (item.type === 'directory') {
      await this.copyDirectory(oldPath, newPath);
      await this.rmdir(oldPath, true);
    } else {
      await this.copyFile(oldPath, newPath);
      await this.unlink(oldPath);
    }
    this.emitEvent(oldPath, 'rename');
  }

  /** 创建快捷方式 (软链接) */
  public async createSymlink(targetPath: string, linkRawPath: string): Promise<void> {
    await this.ready();
    const linkPath = this.normalizePath(linkRawPath);
    if (this.files.has(linkPath)) throw new Error('EEXIST: 快捷方式路径已被占用');

    const item: FSItem = {
      type: 'symlink',
      mtime: Date.now(),
      size: 0,
      target: targetPath
    };

    this.files.set(linkPath, item);
    this.updateIndex(linkPath, 'add');
    await this.saveMetadata(linkPath, item);
    this.emitEvent(linkPath, 'create');
  }

  /** 移至回收站 */
  public async moveToTrash(rawPath: string): Promise<void> {
    await this.ready();
    const path = this.normalizePath(rawPath);
    const item = this.files.get(path);
    if (!item) throw new Error('ENOENT: 文件/目录不存在');

    if (!this.files.has('C:/.trash')) await this.mkdir('C:/.trash');

    // 生成防冲突的回收站内部名
    const trashId = `${Date.now()}_${this.basename(path)}`;
    const trashPath = `C:/.trash/${trashId}`;

    // 将实际文件/目录挪进隐藏的 .trash 目录中
    await this.rename(path, trashPath);

    // 记录回收站元数据
    const trashItem: TrashItem = {
      ...item,
      originalPath: path,
      deletedAt: Date.now()
    };

    this.trash.set(trashPath, trashItem);
    if (this.idb) {
      const tx = this.idb.transaction(IDB_TRASH, 'readwrite');
      await tx.objectStore(IDB_TRASH).put({ path: trashPath, data: trashItem });
    }
  }

  /** 获取回收站列表 */
  public async getTrashItems(): Promise<TrashItem[]> {
    await this.ready();
    return Array.from(this.trash.values());
  }

  /** 从回收站恢复 */
  public async restoreFromTrash(originalPath: string): Promise<void> {
    await this.ready();
    const trashEntry = Array.from(this.trash.entries()).find(
      ([_, item]) => item.originalPath === originalPath
    );
    if (!trashEntry) throw new Error('ENOENT: 回收站中未找到此项');

    const [trashPath, trashItem] = trashEntry;

    // 如果原目录不存在了（比如父级被删），恢复到桌面或者根目录可以自行在这里补充逻辑
    await this.rename(trashPath, trashItem.originalPath);

    this.trash.delete(trashPath);
    if (this.idb) {
      const tx = this.idb.transaction(IDB_TRASH, 'readwrite');
      await tx.objectStore(IDB_TRASH).delete(trashPath);
    }
  }

  /** 清空回收站 */
  public async emptyTrash(): Promise<void> {
    await this.ready();
    for (const trashPath of this.trash.keys()) {
      const item = this.files.get(trashPath);
      if (item?.type === 'directory') await this.rmdir(trashPath, true);
      else if (item) await this.unlink(trashPath);
    }

    this.trash.clear();
    if (this.idb) {
      const tx = this.idb.transaction(IDB_TRASH, 'readwrite');
      await tx.objectStore(IDB_TRASH).clear();
    }
  }

  /** 文件内容/名搜索 (供全局检索栏使用) */
  public async search(keyword: string, dirRawPath: string = 'C:'): Promise<FileMetadata[]> {
    await this.ready();
    const dirPath = this.normalizePath(dirRawPath);
    const lowerKeyword = keyword.toLowerCase();
    const result: FileMetadata[] = [];

    // 快速遍历内存元数据
    for (const [path, item] of this.files.entries()) {
      if (path.startsWith(dirPath) && this.basename(path).toLowerCase().includes(lowerKeyword)) {
        result.push({
          name: this.basename(path),
          path,
          size: item.size,
          mtime: item.mtime,
          type: item.type,
          hidden: item.hidden,
          readOnly: item.readOnly,
          permissions: item.permissions,
          mimeType: item.mimeType
        });
      }
    }
    return result;
  }

  // ==================== 事件总线机制 ====================
  public watch(path: string, cb: WatchCallback) {
    const p = this.normalizePath(path);
    if (!this.watches.has(p)) this.watches.set(p, new Set());
    this.watches.get(p)!.add(cb);
  }

  public unwatch(path: string, cb: WatchCallback) {
    this.watches.get(this.normalizePath(path))?.delete(cb);
  }

  private emitEvent(path: string, event: 'create' | 'write' | 'delete' | 'rename') {
    this.watches.get(path)?.forEach((cb) => cb(path, event));
    // 触发父目录的更新事件（比如在文件夹里新建了文件，文件夹本身也需要被通知刷新）
    const parent = this.dirname(path);
    if (parent) this.watches.get(parent)?.forEach((cb) => cb(path, event));
  }
}

// 导出全局单例内核
export const vfs = new VirtualFileSystem();
