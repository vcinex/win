import type { Component } from 'vue';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

// 静态应用定义（存放在注册表中）
export interface AppDefinition {
  id: string;
  name: string;
  icon?: string;
  // ✅ 高效核心：改为返回 Promise 的函数，支持 Vite 的异步代码分割
  component: () => Promise<{ default: Component } | Component>;
  defaultSize?: WindowSize;
  category?: string;
  single?: boolean; // 是否只能单开（单例模式）
}

// 运行时窗口状态（存放在 Pinia 中）
export interface WindowState {
  id: string; // 唯一的窗口 ID (类似句柄 HWND)
  pid: string; // 进程 ID (当前窗口属于哪个进程运行实例)
  appId: string; // 关联的应用 ID
  title: string;
  icon: string;
  position: WindowPosition;
  size: WindowSize;
  minimized: boolean;
  maximized: boolean;
  fullscreen: boolean;
  zIndex: number;
  // ✅ 组件与参数
  component: Component;
  props?: Record<string, any>;
}
