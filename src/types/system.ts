import { DefineComponent } from 'vue'

// 应用注册表配置
export interface AppConfig {
  id: string
  name: string
  icon: string
  component: DefineComponent<any, any, any> | any
  defaultWidth: number
  defaultHeight: number
  resizable?: boolean
}

// 运行中的窗口进程状态
export interface WindowProcess {
  pid: string // 唯一进程ID
  appId: string // 关联的App ID
  title: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isMinimized: boolean
  isMaximized: boolean
  isActive: boolean
  props?: Record<string, any> // 传递给具体应用的参数 (如要打开的文件路径)
}

// 右键菜单项
export interface ContextMenuItem {
  label: string
  icon?: string
  action?: () => void
  divided?: boolean
  disabled?: boolean
  children?: ContextMenuItem[]
}

export interface FileSystemInterface {
  readDir: (path: string) => Promise<any[]>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  mkdir: (path: string) => Promise<void>
  rename: (oldPath: string, newPath: string) => Promise<void>
  rm: (path: string) => Promise<void>
  copy: (src: string, dest: string) => Promise<void>
  move: (src: string, dest: string) => Promise<void>
}
