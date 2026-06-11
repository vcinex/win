<template>
  <Teleport to="body">
    <transition name="fade-up">
      <div v-if="modelValue" class="start-menu-panel">
        <div class="search-box">
          <input type="text" placeholder="键入此处以搜索" />
        </div>

        <div class="section-title">已固定应用</div>
        <div class="pinned-grid">
          <div
            v-for="(app, key) in appRegistry"
            :key="key"
            class="app-pin-item"
            @click="launchApp(key)"
          >
            <img :src="app.icon" class="app-icon" />
            <span>{{ app.name }}</span>
          </div>
        </div>

        <div class="footer-user">
          <span>当前用户：Vengineer</span>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { appRegistry } from '../../../services/appRegistry'
import { useSystemManager } from '../../../composables/useSystemManager'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])
const sys = useSystemManager()

const launchApp = (appKey: string) => {
  sys.openApp(appKey)
  emit('update:modelValue', false) // 启动后收起开始菜单
}
</script>

<style scoped>
.start-menu-panel {
  position: fixed;
  bottom: 58px;
  left: 50%;
  transform: translateX(-50%);
  width: 420px;
  height: 480px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  z-index: 99998;
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.search-box input {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: #fff;
}
.section-title {
  font-size: 13px;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 10px;
}
.pinned-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.app-pin-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
}
.app-pin-item:hover {
  background: rgba(0, 0, 0, 0.05);
}
.app-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 4px;
}
.app-pin-item span {
  font-size: 11px;
  text-align: center;
}
.footer-user {
  margin-top: auto;
  border-top: 1px solid #ddd;
  padding-top: 10px;
  font-size: 12px;
}

/* 出场动画 */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.2s cubic-bezier(0.1, 0.9, 0.2, 1);
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
