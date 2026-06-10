export interface FileMetadata {
  name: string
  path: string
  size: number
  mtime: number // 修改时间
  type: 'file' | 'directory'
}

export interface VFSNode extends FileMetadata {
  content?: string
  children?: Map<string, VFSNode>
}

export const FS_STORAGE_KEY = 'vfs_root'
