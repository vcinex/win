<template>
  <Teleport to="body">
    <div class="toast-container">
      <transition-group name="toast-slide">
        <div v-for="toast in toasts" :key="toast.id" class="toast-card" :class="toast.type">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotification } from '../../../composables/useNotification'

const { toasts } = useNotification()
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 60px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100000;
}
.toast-card {
  width: 280px;
  padding: 12px;
  border-radius: 6px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
}
.toast-title {
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 4px;
}
.toast-msg {
  font-size: 12px;
  color: #555;
}
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(50px);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
.error {
  border-left: 4px solid #e81123;
}
.success {
  border-left: 4px solid #107c10;
}
</style>
