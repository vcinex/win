import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WindowProcess } from '../types/system'

export const useWindowStore = defineStore('windows', () => {
  const processes = ref<Map<string, WindowProcess>>(new Map())
  const highestZIndex = ref(100)

  return {
    processes,
    highestZIndex
  }
})
