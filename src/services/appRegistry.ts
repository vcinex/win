import type { AppDefinition } from '../types/system'
import HelloWorld from '../components/HelloWorld.vue'
import TextEditor from '../components/TextEditor.vue'

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
  component: HelloWorld,
  defaultSize: { width: 560, height: 420 }
})

registerApp({
  id: 'text-editor',
  title: '文本编辑器',
  icon: '📝',
  component: TextEditor,
  defaultSize: { width: 900, height: 600 }
})
