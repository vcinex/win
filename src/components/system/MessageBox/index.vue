<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-backdrop" @click.self="handleCancel">
      <div class="dialog-box">
        <div class="dialog-header">
          <span class="title">{{ state.options.title }}</span>
          <button class="close-btn" @click="handleCancel">×</button>
        </div>
        <div class="dialog-body">
          <p>{{ state.options.content }}</p>
        </div>
        <div class="dialog-footer">
          <button v-if="isConfirm" class="btn btn-secondary" @click="handleCancel">取消</button>
          <button class="btn btn-primary" @click="handleConfirm">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDialog } from '../../../composables/useDialog'

const { state, hideMessage } = useDialog()

const isOpen = computed(() => state.visible)
const isConfirm = computed(() => state.options.type === 'confirm')

const handleConfirm = () => {
  if (state.options.onConfirm) state.options.onConfirm()
  hideMessage()
}

const handleCancel = () => {
  if (state.options.onCancel) state.options.onCancel()
  hideMessage()
}
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100000;
  backdrop-filter: blur(2px);
}
.dialog-box {
  background: #fff;
  border-radius: 8px;
  width: 320px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
}
.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}
.dialog-body {
  padding: 16px;
  font-size: 13px;
  color: #333;
}
.dialog-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.btn {
  padding: 6px 16px;
  border-radius: 4px;
  border: none;
  font-size: 12px;
  cursor: pointer;
}
.btn-primary {
  background: #0078d4;
  color: white;
}
.btn-primary:hover {
  background: #005a9e;
}
.btn-secondary {
  background: #f3f3f3;
  color: #333;
}
.btn-secondary:hover {
  background: #e5e5e5;
}
</style>
