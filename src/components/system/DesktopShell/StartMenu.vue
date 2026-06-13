<template>
  <Transition name="start-menu-fade">
    <div v-if="isOpen" class="start-menu-panel" @click.stop>
      <div class="pinned-section">
        <h4>已固定</h4>
        <div class="app-grid">
          <button
            v-for="app in registeredApps"
            :key="app.id"
            class="app-grid-item"
            @click="handleLaunchApp(app.id)"
          >
            <span class="app-icon">{{ app.icon || '📦' }}</span>
            <span class="app-name">{{ app.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { listApps, registerApp } from '@/services/appRegistry';
// ✅ 直接引入注册表服务
import { osBus } from '@/services/eventBus';

// ✅ 引入事件总线

defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

// 保留原有的应用注册逻辑
registerApp({
  id: 'hello-world',
  name: 'Welcome',
  icon: '🌐',
  component: () => import('../Welcome/index.vue'),
  defaultSize: { width: 560, height: 420 },
  single: false
});

const registeredApps = computed(() => listApps());

function handleLaunchApp(appId: string) {
  emit('close');
  // ✅ 发送系统意图，彻底解耦
  osBus.emit('intent:launch_app', { appId: `${appId}` });
}
</script>

<style scoped>
.start-menu-panel {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%; /* 修改：占满可用宽度 */
  max-width: 640px; /* 新增：最大不超过 640px */
  height: 600px;
  background: rgba(243, 243, 243, 0.95);
  backdrop-filter: blur(40px);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  display: flex;
  flex-direction: column;
  padding: 24px;
  z-index: 10001;
}

@media (prefers-color-scheme: dark) {
  .start-menu-panel {
    background: rgba(36, 36, 36, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #fff;
  }
}

.search-bar {
  width: 100%; /* 新增：约束父容器宽度 */
}

.search-bar input {
  width: 100%;
  height: 36px;
  padding: 0 16px;
  box-sizing: border-box; /* 新增：强制应用边框盒模型 */
  border-radius: 18px;
  border: 1px solid #ccc;
  background: rgba(255, 255, 255, 0.7);
  outline: none;
}

@media (prefers-color-scheme: dark) {
  .search-bar input {
    background: rgba(0, 0, 0, 0.3);
    border-color: transparent;
    color: #fff;
  }
}

.pinned-section {
  margin-top: 24px;
}
.pinned-section h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
.app-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.1s;
  color: inherit;
}
.app-grid-item:hover {
  background: rgba(0, 0, 0, 0.05);
}
@media (prefers-color-scheme: dark) {
  .app-grid-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}
.app-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.app-name {
  font-size: 12px;
}

/* Vue 过渡动画 */
.start-menu-fade-enter-active,
.start-menu-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.1, 0.9, 0.2, 1);
}
.start-menu-fade-enter-from,
.start-menu-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px) scale(0.95);
}
</style>
