import { reactive } from 'vue'

export interface DialogOptions {
  title: string
  content: string
  type?: 'info' | 'warning' | 'error' | 'confirm'
  onConfirm?: () => void
  onCancel?: () => void
}

const state = reactive({
  visible: false,
  options: {} as DialogOptions
})

export function useDialog() {
  const showMessage = (options: DialogOptions) => {
    state.options = options
    state.visible = true
  }

  const hideMessage = () => {
    state.visible = false
  }

  return {
    state,
    showMessage,
    hideMessage
  }
}
