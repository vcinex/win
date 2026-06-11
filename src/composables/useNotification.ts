import { reactive } from 'vue'

export interface Toast {
  id: string
  title: string
  message: string
  type?: 'info' | 'success' | 'error'
}

const toasts = reactive<Toast[]>([])

export function useNotification() {
  const notify = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = `toast_${Date.now()}`
    toasts.push({ id, title, message, type })
    setTimeout(() => {
      const idx = toasts.findIndex((t) => t.id === id)
      if (idx !== -1) toasts.splice(idx, 1)
    }, 4000) // 4秒后自动销毁通知
  }

  return {
    toasts,
    notify
  }
}
