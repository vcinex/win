export type FSType = 'file' | 'directory' | 'symlink';

export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  mtime: number; // 修改时间
  type: FSType;
  hidden?: boolean;
  readOnly?: boolean;
  permissions?: number;
  mimeType?: string; // 新增：标识文件具体类型
}

export interface FSItem {
  type: FSType;
  mtime: number;
  size: number;
  target?: string; // 软链接目标
  hidden?: boolean;
  readOnly?: boolean;
  permissions?: number;
  locked?: boolean;
  mimeType?: string; // 新增：标识文件具体类型
}

export interface TrashItem extends FSItem {
  originalPath: string;
  deletedAt: number;
}
