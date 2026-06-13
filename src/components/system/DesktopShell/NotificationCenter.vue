<template>
  <div class="notification-center">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast-item error">
        <div class="toast-header">
          <span class="toast-icon">⚠️</span>
          <span class="toast-source">系统提示 ({{ toast.source }})</span>
          <button class="toast-close" @click="removeToast(toast.id)">×</button>
        </div>
        <div class="toast-body">{{ toast.message }}</div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { useSystemEvent } from '@/composables';
import type { SystemIntents } from '@/types';

type ToastMessage = SystemIntents['system:toast'] & {
  id: number;
};

const toasts = ref<ToastMessage[]>([]);

// 处理系统错误广播
const handleSystemError = (payload: SystemIntents['system:toast']) => {
  const id = Date.now();
  toasts.value.push({ id, ...payload });

  // 5秒后自动关闭提示框
  setTimeout(() => {
    removeToast(id);
  }, 5000);
};

const removeToast = (id: number) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

// 挂载时监听，卸载时移除
useSystemEvent('system:toast', handleSystemError);
</script>

<style scoped>
/* 悬浮在屏幕右下角 */
.notification-center {
  position: absolute;
  bottom: 60px; /* 在任务栏上方 */
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999; /* 保证在最顶层 */
  pointer-events: none; /* 让鼠标可以点穿空白处 */
}

.toast-item {
  width: 300px;
  background-color: rgba(30, 30, 30, 0.9);
  border-left: 4px solid #ff4d4f; /* 红色表示错误 */
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  color: white;
  pointer-events: auto; /* 恢复自身的鼠标事件 */
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.toast-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: bold;
}

.toast-source {
  flex: 1;
  margin-left: 6px;
  opacity: 0.8;
}

.toast-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.6;
}

.toast-close:hover {
  opacity: 1;
}

.toast-body {
  padding: 12px;
  font-size: 13px;
  line-height: 1.4;
  color: #e0e0e0;
}

/* Vue 过渡动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%); /* 从右侧滑入 */
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px); /* 向上滑动消失 */
}
</style>
