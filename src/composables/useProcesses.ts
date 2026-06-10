import { reactive, shallowRef, ref } from 'vue'
import type { WindowState, AppDefinition } from '@/types'

const processes = reactive<Map<string, WindowState>>(new Map())
const maxZIndex = ref(100)

export function useProcesses() {
  const openProcess = (app: AppDefinition) => {
    const id = `${app.id}-${Date.now()}`
    maxZIndex.value++
    processes.set(id, {
      id,
      title: app.title,
      component: shallowRef(app.component),
      position: { x: 100, y: 100 },
      size: app.defaultSize,
      zIndex: maxZIndex.value,
      active: true,
      minimize: false
    })
  }

  const closeProcess = (id: string) => {
    processes.delete(id)
  }

  const focusProcess = (id: string) => {
    const process = processes.get(id)
    if (process && !process.active) {
      maxZIndex.value++
      processes.forEach((p) => (p.active = false))
      process.active = true
      process.zIndex = maxZIndex.value
    }
  }

  const updateProcess = (id: string, updates: Partial<WindowState>) => {
    const process = processes.get(id)
    if (!process) return

    // 深度合并位置和大小，防止 Partial 更新丢失原有坐标轴
    if (updates.position) {
      process.position = { ...process.position, ...updates.position }
    }
    if (updates.size) {
      process.size = { ...process.size, ...updates.size }
    }
    // 合并其他属性
    Object.assign(process, { ...updates, position: process.position, size: process.size })
  }

  return {
    processes,
    openProcess,
    closeProcess,
    focusProcess,
    updateProcess
  }
}
