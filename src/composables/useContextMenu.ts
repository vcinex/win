import { reactive } from 'vue'
import type { ContextMenuItem } from '../types/system'

const state = reactive({
  visible: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[]
})

export function useContextMenu() {
  const showMenu = (e: MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault()
    state.x = e.clientX
    state.y = e.clientY
    state.items = items
    state.visible = true
  }

  const hideMenu = () => {
    state.visible = false
  }

  return {
    state,
    showMenu,
    hideMenu
  }
}
