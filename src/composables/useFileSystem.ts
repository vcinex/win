import { reactive } from 'vue'
import type { FileMetadata, FSItem, TrashItem } from '@/services'

// ==================== 全局状态 ====================
const fsState = reactive<{
  files: Record<string, FSItem>
  trash: Record<string, TrashItem>
  watches: Map<string, Set<(path: string, event: string) => void>>
  tempCounter: number
  opfsRoot?: FileSystemDirectoryHandle
  ready: boolean
}>({
  files: {},
  trash: {},
  watches: new Map(),
  tempCounter: 0,
  opfsRoot: undefined,
  ready: false
})

// ==================== 存储配置 ====================
let idb: IDBDatabase | null = null
const IDB_NAME = 'vfs_opfs'
const IDB_STORE = 'metadata'
const IDB_TRASH_STORE = 'trash'

// ==================== 初始化 IndexedDB ====================
async function initIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 2)

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'path' })
      }
      if (!db.objectStoreNames.contains(IDB_TRASH_STORE)) {
        db.createObjectStore(IDB_TRASH_STORE, { keyPath: 'path' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ==================== 初始化 OPFS ====================
async function initOpfs() {
  return await navigator.storage.getDirectory()
}

// ==================== 加载元数据 ====================
async function loadAllMetadata() {
  if (!idb) return

  // 加载文件元数据
  const filesTx = idb.transaction(IDB_STORE, 'readonly')
  const filesStore = filesTx.objectStore(IDB_STORE)
  const filesReq = filesStore.getAll()

  await new Promise<void>((resolve) => {
    filesReq.onsuccess = () => {
      const items = filesReq.result || []
      const files: Record<string, FSItem> = {}
      items.forEach((item: any) => (files[item.path] = item.data))
      fsState.files = files
      resolve()
    }
  })

  // 加载回收站
  const trashTx = idb.transaction(IDB_TRASH_STORE, 'readonly')
  const trashStore = trashTx.objectStore(IDB_TRASH_STORE)
  const trashReq = trashStore.getAll()

  await new Promise<void>((resolve) => {
    trashReq.onsuccess = () => {
      const items = trashReq.result || []
      const trash: Record<string, TrashItem> = {}
      items.forEach((item: any) => (trash[item.path] = item.data))
      fsState.trash = trash
      resolve()
    }
  })
}

// ==================== 初始化默认目录结构 ====================
async function initDefaultStructure() {
  if (Object.keys(fsState.files).length > 0) return

  const now = Date.now()
  const defaultDirs = [
    'C:',
    'C:/Users',
    'C:/Users/Admin',
    'C:/Users/Admin/Desktop',
    'C:/Users/Admin/Documents',
    'C:/Users/Admin/Pictures',
    'C:/Users/Admin/Music',
    'C:/Users/Admin/Videos',
    'D:'
  ]

  for (const path of defaultDirs) {
    await createDirectoryInternal(path, now)
  }

  // 默认说明文件
  const docPath = 'C:/Users/Admin/Documents/使用说明.txt'
  await writeFileInternal(docPath, '欢迎使用！修改后实时生效。', now)
}

// ==================== 全量初始化 ====================
async function initFileSystem() {
  try {
    idb = await initIdb()
    fsState.opfsRoot = await initOpfs()
    await loadAllMetadata()
    await initDefaultStructure()
    fsState.ready = true
    console.log('✅ OPFS 虚拟文件系统已就绪')
  } catch (err) {
    console.error('❌ 文件系统初始化失败', err)
  }
}

initFileSystem()

// ==================== 核心工具：路径处理 ====================
const normalizePath = (p: string) => p.replace(/\\/g, '/').replace(/\/+/g, '/')
const resolvePath = (...segments: string[]) => normalizePath(segments.join('/'))
const basename = (p: string) => normalizePath(p).split('/').pop() || ''
const dirname = (p: string) => {
  const parts = normalizePath(p).split('/')
  parts.pop()
  return parts.join('/') || ''
}
const extname = (p: string) => {
  const b = basename(p)
  const idx = b.lastIndexOf('.')
  return idx > 0 ? b.slice(idx) : ''
}

// ==================== 核心工具：监听触发 ====================
const triggerWatch = (path: string, event: string) => {
  const p = normalizePath(path)
  fsState.watches.get(p)?.forEach((cb) => cb(p, event))
  const parent = dirname(p)
  fsState.watches.get(parent)?.forEach((cb) => cb(p, event))
}

// ==================== OPFS 文件操作 ====================
async function getFileHandle(path: string, create = false) {
  if (!fsState.opfsRoot) throw new Error('OPFS 未初始化')
  const parts = normalizePath(path).split('/').filter(Boolean)
  let handle: FileSystemDirectoryHandle | FileSystemFileHandle = fsState.opfsRoot

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isLast = i === parts.length - 1

    if (isLast) {
      handle = await handle.getFileHandle(part, { create })
    } else {
      handle = await handle.getDirectoryHandle(part, { create })
    }
  }
  return handle as FileSystemFileHandle
}

async function readOpfsText(path: string): Promise<string> {
  try {
    const handle = await getFileHandle(path)
    const file = await handle.getFile()
    return await file.text()
  } catch {
    return ''
  }
}

async function writeOpfsText(path: string, content: string) {
  const handle = await getFileHandle(path, true)
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function readOpfs(path: string): Promise<File> {
  const handle = await getFileHandle(path)
  const file = await handle.getFile()
  return file
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function writeOpfs(path: string, content: FileSystemWriteChunkType) {
  const handle = await getFileHandle(path, true)
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

async function removeOpfsEntry(path: string) {
  if (!fsState.opfsRoot) return
  const parts = normalizePath(path).split('/').filter(Boolean)
  const name = parts.pop()!
  let dir = fsState.opfsRoot
  for (const p of parts) dir = await dir.getDirectoryHandle(p)
  await dir.removeEntry(name, { recursive: true })
}

// ==================== 内部元数据操作 ====================
async function saveMetadata(path: string, data: FSItem) {
  if (!idb) return
  const tx = idb.transaction(IDB_STORE, 'readwrite')
  await tx.objectStore(IDB_STORE).put({ path, data })
}

async function deleteMetadata(path: string) {
  if (!idb) return
  const tx = idb.transaction(IDB_STORE, 'readwrite')
  await tx.objectStore(IDB_STORE).delete(path)
}

async function saveTrash(path: string, data: TrashItem) {
  if (!idb) return
  const tx = idb.transaction(IDB_TRASH_STORE, 'readwrite')
  await tx.objectStore(IDB_TRASH_STORE).put({ path, data })
}

async function deleteTrash(path: string) {
  if (!idb) return
  const tx = idb.transaction(IDB_TRASH_STORE, 'readwrite')
  await tx.objectStore(IDB_TRASH_STORE).delete(path)
}

async function createDirectoryInternal(path: string, mtime: number) {
  const item: FSItem = {
    type: 'directory',
    mtime,
    size: 0,
    hidden: false,
    readOnly: false,
    permissions: 0o755,
    locked: false
  }
  fsState.files[path] = item
  await saveMetadata(path, item)
}

async function writeFileInternal(path: string, content: string, mtime: number) {
  const size = new Blob([content]).size
  await writeOpfsText(path, content)

  const item: FSItem = {
    type: 'file',
    mtime,
    size,
    hidden: false,
    readOnly: false,
    permissions: 0o644,
    locked: false
  }
  fsState.files[path] = item
  await saveMetadata(path, item)
}

// ==================== 对外导出：useFileSystem ====================
export function useFileSystem() {
  const ready = async () => {
    while (!fsState.ready) await new Promise((r) => setTimeout(r, 10))
  }

  // ==============================================
  // 基础读写
  // ==============================================
  const readFile = async (path: string) => {
    await ready()
    const item = fsState.files[path]
    if (item?.type === 'file') return await readOpfsText(path)
    if (item?.type === 'symlink' && item.target) return readFile(item.target)
    return null
  }

  const writeFile = async (path: string, content: string) => {
    await ready()
    const item = fsState.files[path]
    if (item?.readOnly) throw new Error('文件只读')
    if (item?.locked) throw new Error('文件已锁定')

    const now = Date.now()
    const size = new Blob([content]).size
    await writeOpfsText(path, content)

    const newItem: FSItem = {
      ...item,
      type: 'file',
      mtime: now,
      size,
      hidden: item?.hidden ?? false,
      readOnly: item?.readOnly ?? false,
      permissions: item?.permissions ?? 0o644,
      locked: item?.locked ?? false
    }
    fsState.files[path] = newItem
    await saveMetadata(path, newItem)
    triggerWatch(path, 'write')
  }

  // ==============================================
  // 目录
  // ==============================================
  const createDirectory = async (path: string) => {
    await ready()
    if (fsState.files[path]) return false
    await createDirectoryInternal(path, Date.now())
    triggerWatch(path, 'create')
    return true
  }

  const deleteFile = async (path: string) => {
    await ready()
    const item = fsState.files[path]
    if (!item || item.readOnly || item.locked) return

    // 删除 OPFS
    await removeOpfsEntry(path)

    // 删除子项
    if (item.type === 'directory') {
      const prefix = path + '/'
      const keys = Object.keys(fsState.files).filter((k) => k.startsWith(prefix))
      for (const k of keys) {
        await deleteMetadata(k)
        delete fsState.files[k]
      }
    }

    await deleteMetadata(path)
    delete fsState.files[path]
    triggerWatch(path, 'delete')
  }

  // ==============================================
  // 查询
  // ==============================================
  const exists = (path: string) => !!fsState.files[path]
  const isFile = (path: string) => fsState.files[path]?.type === 'file'
  const isDirectory = (path: string) => fsState.files[path]?.type === 'directory'
  const isSymlink = (path: string) => fsState.files[path]?.type === 'symlink'

  const getMetadata = (path: string): FileMetadata | null => {
    const item = fsState.files[path]
    if (!item) return null
    return {
      name: basename(path),
      path,
      size: item.size,
      mtime: item.mtime,
      type: item.type,
      hidden: item.hidden,
      readOnly: item.readOnly,
      permissions: item.permissions
    }
  }

  const readDirectory = (dirPath: string): FileMetadata[] => {
    const res: FileMetadata[] = []
    if (dirPath === '') {
      return Object.keys(fsState.files)
        .filter((p) => !p.includes('/'))
        .map((p) => getMetadata(p)!)
    }
    const prefix = dirPath + '/'
    Object.keys(fsState.files).forEach((path) => {
      if (path.startsWith(prefix)) {
        const suffix = path.slice(prefix.length)
        if (suffix && !suffix.includes('/')) res.push(getMetadata(path)!)
      }
    })
    return res.sort((a, b) =>
      a.type !== b.type ? (a.type === 'directory' ? -1 : 1) : a.name.localeCompare(b.name)
    )
  }

  // ==============================================
  // 重命名
  // ==============================================
  const renameFile = async (oldPath: string, newPath: string) => {
    await ready()
    if (!exists(oldPath) || exists(newPath)) return false
    const item = fsState.files[oldPath]
    if (item.readOnly || item.locked) return false

    if (item.type === 'file') {
      const content = await readOpfsText(oldPath)
      await writeOpfsText(newPath, content)
      await removeOpfsEntry(oldPath)
    }

    const updated = { ...item, mtime: Date.now() }
    fsState.files[newPath] = updated
    await saveMetadata(newPath, updated)
    await deleteMetadata(oldPath)
    delete fsState.files[oldPath]

    triggerWatch(oldPath, 'rename')
    triggerWatch(newPath, 'rename')
    return true
  }

  // ==============================================
  // 复制 / 删除目录 / 追加
  // ==============================================
  const copyFile = async (src: string, dest: string, overwrite = false) => {
    await ready()
    if (!isFile(src) || (!overwrite && exists(dest))) return false
    const content = await readOpfsText(src)
    await writeFile(dest, content)
    return true
  }

  const deleteDirectory = async (path: string, recursive = false) => {
    await ready()
    if (!isDirectory(path)) return false
    if (!recursive && readDirectory(path).length > 0) return false
    await deleteFile(path)
    return true
  }

  const appendFile = async (path: string, content: string) => {
    const curr = (await readFile(path)) || ''
    await writeFile(path, curr + content)
  }

  // ==============================================
  // 流
  // ==============================================
  const createReadStream = (path: string) =>
    new ReadableStream({
      async start(ctrl) {
        ctrl.enqueue((await readFile(path)) || '')
        ctrl.close()
      }
    })

  const createWriteStream = (path: string) =>
    new WritableStream({
      async write(chunk) {
        await appendFile(path, chunk as string)
      }
    })

  // ==============================================
  // 软链接
  // ==============================================
  const createSymlink = async (target: string, linkPath: string) => {
    await ready()
    if (exists(linkPath)) return false
    const item: FSItem = {
      type: 'symlink',
      target,
      mtime: Date.now(),
      size: 0
    }
    fsState.files[linkPath] = item
    await saveMetadata(linkPath, item)
    return true
  }

  const readSymlink = (path: string) => {
    return isSymlink(path) ? fsState.files[path].target || null : null
  }

  // ==============================================
  // 权限 / 锁定 / 隐藏
  // ==============================================
  const setPermissions = async (path: string, mode: number) => {
    await ready()
    if (!exists(path)) return
    fsState.files[path].permissions = mode
    await saveMetadata(path, fsState.files[path])
  }

  const getPermissions = (path: string) => {
    return fsState.files[path]?.permissions ?? 0o644
  }

  const lockFile = async (path: string) => {
    await ready()
    if (exists(path)) {
      fsState.files[path].locked = true
      await saveMetadata(path, fsState.files[path])
    }
  }

  const unlockFile = async (path: string) => {
    await ready()
    if (exists(path)) {
      fsState.files[path].locked = false
      await saveMetadata(path, fsState.files[path])
    }
  }

  const setHidden = async (path: string, hidden: boolean) => {
    await ready()
    if (exists(path)) {
      fsState.files[path].hidden = hidden
      await saveMetadata(path, fsState.files[path])
    }
  }

  const setReadOnly = async (path: string, readOnly: boolean) => {
    await ready()
    if (exists(path)) {
      fsState.files[path].readOnly = readOnly
      await saveMetadata(path, fsState.files[path])
    }
  }

  const setMetadata = async (path: string, meta: Partial<FileMetadata>) => {
    await ready()
    const item = fsState.files[path]
    if (!item) return
    if (meta.mtime) item.mtime = meta.mtime
    if (meta.hidden !== undefined) item.hidden = meta.hidden
    if (meta.readOnly !== undefined) item.readOnly = meta.readOnly
    await saveMetadata(path, item)
  }

  // ==============================================
  // 磁盘
  // ==============================================
  const listDisks = () => {
    return Object.keys(fsState.files)
      .filter((p) => !p.includes('/'))
      .map((d) => ({
        path: d,
        free: 1024 * 1024 * 1024,
        total: 10 * 1024 * 1024 * 1024
      }))
  }

  const getDiskUsage = () => ({
    total: 10 * 1024 * 1024 * 1024,
    free: 1024 * 1024 * 1024,
    used: 9 * 1024 * 1024 * 1024
  })

  // ==============================================
  // 回收站
  // ==============================================
  const trash = async (path: string) => {
    await ready()
    const item = fsState.files[path]
    if (!item || item.readOnly || item.locked) return false

    const trashItem: TrashItem = {
      ...item,
      originalPath: path,
      deletedAt: Date.now()
    }
    fsState.trash[path] = trashItem
    await saveTrash(path, trashItem)
    await deleteFile(path)
    return true
  }

  const restoreTrash = async (trashPath: string) => {
    await ready()
    const item = fsState.trash[trashPath]
    if (!item) return false

    fsState.files[trashPath] = { ...item, mtime: Date.now() }
    await saveMetadata(trashPath, fsState.files[trashPath])
    await deleteTrash(trashPath)
    delete fsState.trash[trashPath]
    return true
  }

  const listTrash = () => Object.values(fsState.trash)
  const emptyTrash = async () => {
    await ready()
    fsState.trash = {}
    if (idb) {
      const tx = idb.transaction(IDB_TRASH_STORE, 'readwrite')
      await tx.objectStore(IDB_TRASH_STORE).clear()
    }
  }

  // ==============================================
  // 临时文件 / 原子写入
  // ==============================================
  const makeTempFile = async (prefix = 'tmp') => {
    await ready()
    const p = `${prefix}_${fsState.tempCounter++}.tmp`
    await writeFile(p, '')
    return p
  }

  const makeTempDir = async (prefix = 'tmpdir') => {
    await ready()
    const p = `${prefix}_${fsState.tempCounter++}`
    await createDirectory(p)
    return p
  }

  const atomicWriteFile = async (path: string, content: string) => {
    const tmp = await makeTempFile()
    await writeFile(tmp, content)
    await deleteFile(path)
    await renameFile(tmp, path)
  }

  // ==============================================
  // 监听
  // ==============================================
  const watch = (path: string, cb: (path: string, event: string) => void) => {
    const p = normalizePath(path)
    if (!fsState.watches.has(p)) fsState.watches.set(p, new Set())
    fsState.watches.get(p)!.add(cb)
    return () => unwatch(path, cb)
  }

  const unwatch = (path: string, cb: (path: string, event: string) => void) => {
    fsState.watches.get(normalizePath(path))?.delete(cb)
  }

  // ==============================================
  // 目录树 / 复制目录
  // ==============================================
  const readDirectoryTree = (dir: string) => {
    const tree: FileMetadata[] = []
    const walk = (p: string) => {
      const items = readDirectory(p)
      items.forEach((i) => {
        tree.push(i)
        if (i.type === 'directory') walk(i.path)
      })
    }
    walk(dir)
    return tree
  }

  const copyDirectory = async (src: string, dest: string, overwrite = false) => {
    await ready()
    if (!isDirectory(src) || (!overwrite && exists(dest))) return false
    await createDirectory(dest)
    const items = readDirectory(src)
    for (const item of items) {
      const target = resolvePath(dest, basename(item.path))
      if (item.type === 'file') await copyFile(item.path, target, overwrite)
      if (item.type === 'directory') await copyDirectory(item.path, target, overwrite)
    }
    return true
  }

  // ==============================================
  // 系统目录
  // ==============================================
  const getSystemDir = (type: string) => {
    const map: Record<string, string> = {
      home: 'C:/Users/Admin',
      desktop: 'C:/Users/Admin/Desktop',
      documents: 'C:/Users/Admin/Documents',
      downloads: 'C:/Users/Admin/Downloads',
      pictures: 'C:/Users/Admin/Pictures',
      music: 'C:/Users/Admin/Music',
      videos: 'C:/Users/Admin/Videos',
      temp: 'C:/Temp'
    }
    return map[type] || ''
  }

  return {
    ready,
    readFile,
    writeFile,
    createDirectory,
    deleteFile,
    getMetadata,
    readDirectory,
    renameFile,
    exists,
    isFile,
    isDirectory,
    isSymlink,
    copyFile,
    deleteDirectory,
    appendFile,
    createReadStream,
    createWriteStream,
    createSymlink,
    readSymlink,
    setPermissions,
    getPermissions,
    lockFile,
    unlockFile,
    setMetadata,
    setHidden,
    setReadOnly,
    listDisks,
    getDiskUsage,
    trash,
    restoreTrash,
    listTrash,
    emptyTrash,
    makeTempFile,
    makeTempDir,
    atomicWriteFile,
    normalizePath,
    resolvePath,
    basename,
    dirname,
    extname,
    watch,
    unwatch,
    readDirectoryTree,
    copyDirectory,
    getSystemDir
  }
}
