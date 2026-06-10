import type { AppDefinition } from '@/types/system'
import Welcome from '@/components/apps/Welcome/index.vue'
import TextEditor from '@/components/apps/TextEditor/index.vue'
import Explorer from '@/components/apps/Explorer/index.vue'

const registry = new Map<string, AppDefinition>()

export function registerApp(app: AppDefinition) {
  if (!app.id) return
  registry.set(app.id, app)
}

export function getApp(id: string) {
  return registry.get(id)
}

export function listApps() {
  return Array.from(registry.values())
}

registerApp({
  id: 'hello-world',
  title: 'Welcome',
  icon: '🌐',
  component: Welcome,
  defaultSize: { width: 560, height: 420 },
  single: true,
})

registerApp({
  id: 'text-editor',
  title: '文本编辑器',
  icon: '📝',
  component: TextEditor,
  defaultSize: { width: 900, height: 600 },
  single: false,

})

registerApp({
  id: 'file-explorer',
  title: '资源管理器',
  icon: '📁',
  component: Explorer,
  defaultSize: { width: 850, height: 550 },
  single: false,
})
