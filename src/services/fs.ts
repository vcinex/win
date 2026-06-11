export interface FileMetadata {
  name: string
  path: string
  size: number
  mtime: number // 修改时间
  type: 'file' | 'directory' | 'symlink'
  hidden?: boolean
  readOnly?: boolean
  permissions?: number
}

export interface FSItem {
  type: 'file' | 'directory' | 'symlink'
  mtime: number
  size: number
  target?: string
  hidden?: boolean
  readOnly?: boolean
  permissions?: number
  locked?: boolean
}

export interface TrashItem extends FSItem {
  originalPath: string
  deletedAt: number
}

export const FS_STORAGE_KEY = 'vfs_root'
