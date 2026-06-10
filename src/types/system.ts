import type { Component } from 'vue'

export interface WindowPosition {
  x: number
  y: number
}

export interface WindowSize {
  width: number
  height: number
}

export interface WindowState {
  id: string
  appId: string
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  minimized: boolean
  maximized: boolean
  zIndex: number
  active?: boolean
  component?: any
  props?: Record<string, any> // ✅ 新增：用于存放传递给组件的属性
}

export interface AppDefinition {
  id: string
  title: string
  icon?: string
  component: Component
  defaultSize?: WindowSize
  category?: string
}
