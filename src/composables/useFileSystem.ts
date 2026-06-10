import { reactive, watch } from 'vue'
import type { FileMetadata } from '@/services/fs'

const STORAGE_KEY = 'vfs_data'

interface FSItem {
  type: 'file' | 'directory'
  content?: string
  mtime: number
  size: number
}

// ✅ 1. 将状态提取到函数外部，作为全局单例共享
const fsState = reactive<{
  files: Record<string, FSItem>
}>({
  files: (() => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (data.files && Object.keys(data.files).length > 0) {
        return data.files
      }
    } catch (e) {}

    const now = Date.now()
    return {
      'C:': { type: 'directory', mtime: now, size: 0 },
      'C:/Users': { type: 'directory', mtime: now, size: 0 },
      'C:/Users/Admin': { type: 'directory', mtime: now, size: 0 },
      'C:/Users/Admin/Desktop': { type: 'directory', mtime: now, size: 0 },
      'C:/Users/Admin/Documents': { type: 'directory', mtime: now, size: 0 },
      'C:/Users/Admin/Documents/使用说明.txt': { 
        type: 'file', 
        content: '欢迎使用！你现在修改这里，资源管理器会实时生效。', 
        mtime: now, size: 64 
      },
      'D:': { type: 'directory', mtime: now, size: 0 }
    }
  })()
})

// 自动持久化
watch(fsState, (newState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
}, { deep: true })

export function useFileSystem() {
  const readFile = (path: string) => {
    const file = fsState.files[path]
    return file && file.type === 'file' ? file.content || '' : null
  }

  const writeFile = (path: string, content: string) => {
    fsState.files[path] = {
      type: 'file',
      content,
      mtime: Date.now(),
      size: new Blob([content]).size
    }
  }

  const createDirectory = (path: string) => {
    if (fsState.files[path]) return false
    fsState.files[path] = { type: 'directory', mtime: Date.now(), size: 0 }
    return true
  }

  const deleteFile = (path: string) => {
    if (!fsState.files[path]) return
    if (fsState.files[path].type === 'directory') {
      const prefix = path + '/'
      Object.keys(fsState.files).forEach((k) => {
        if (k.startsWith(prefix)) delete fsState.files[k]
      })
    }
    delete fsState.files[path]
  }

  const getMetadata = (path: string): FileMetadata | null => {
    const file = fsState.files[path]
    if (!file) return null
    return { name: path.split('/').pop() || path, path, size: file.size, mtime: file.mtime, type: file.type }
  }

  const readDirectory = (dirPath: string): FileMetadata[] => {
    const result: FileMetadata[] = []
    if (dirPath === '') {
      return Object.keys(fsState.files).filter(p => !p.includes('/')).map(p => getMetadata(p)!)
    }
    const prefix = dirPath + '/'
    Object.keys(fsState.files).forEach((path) => {
      if (path.startsWith(prefix)) {
        const suffix = path.substring(prefix.length)
        if (suffix && !suffix.includes('/')) result.push(getMetadata(path)!)
      }
    })
    return result.sort((a, b) => (a.type !== b.type ? (a.type === 'directory' ? -1 : 1) : a.name.localeCompare(b.name)))
  }

  // ✅ 添加重命名功能
  const renameFile = (oldPath: string, newPath: string) => {
    if(!fsState.files[oldPath] || fsState.files[newPath]) return false
    fsState.files[newPath] = { ...fsState.files[oldPath], mtime: Date.now() }
    delete fsState.files[oldPath]
    return true
  }

  return { readFile, writeFile, createDirectory, deleteFile, getMetadata, readDirectory, renameFile }
}