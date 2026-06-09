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
  zIndex: number
  position: WindowPosition
  size: WindowSize
  minimized: boolean
  maximized: boolean
  active: boolean
  component: Component
}

export interface AppDefinition {
  id: string
  title: string
  icon?: string
  component: Component
  defaultSize?: WindowSize
  category?: string
}
