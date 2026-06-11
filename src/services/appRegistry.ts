import { defineAsyncComponent } from 'vue'
import type { AppConfig } from '../types/system'

// 异步加载应用组件，提升系统初始加载速度
const Explorer = defineAsyncComponent(
  () => import('../components/apps/Explorer/views/Win11Explorer.vue')
)
const TextEditor = defineAsyncComponent(() => import('../components/apps/TextEditor/index.vue'))

export const appRegistry: Record<string, AppConfig> = {
  explorer: {
    id: 'explorer',
    name: '文件资源管理器',
    icon: '/icons/folder.svg', // 请确保public有此图标，或替换为现有图标
    component: Explorer,
    defaultWidth: 800,
    defaultHeight: 600,
    resizable: true
  },
  notepad: {
    id: 'notepad',
    name: '记事本',
    icon: '/icons/notepad.svg',
    component: TextEditor,
    defaultWidth: 600,
    defaultHeight: 400,
    resizable: true
  }
}
