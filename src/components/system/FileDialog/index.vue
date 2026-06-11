<template>
  <Teleport to="body">
    <div class="file-dialog-backdrop" @click.self="emit('cancel')">
      <div class="file-dialog-window">
        <div class="top-bar">另存为...</div>
        <div class="path-display">当前目录: C:/Users/Public/Desktop</div>

        <div class="folder-view">
          <div
            v-for="item in items"
            :key="item.name"
            class="vfs-item"
            @click="selectName(item.name)"
          >
            <span>📁 {{ item.name }}</span>
          </div>
        </div>

        <div class="input-group">
          <label>文件名:</label>
          <input v-model="fileNameInput" type="text" />
        </div>

        <div class="action-buttons">
          <button @click="handleSave">保存</button>
          <button @click="emit('cancel')">取消</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fs } from '../../../services/fs'

const emit = defineEmits(['save', 'cancel'])
const fileNameInput = ref('未命名.txt')
const items = ref<any[]>([])

onMounted(async () => {
  try {
    items.value = await fs.readDir('C:/Users/Public/Desktop')
  } catch (e) {
    console.error(e)
  }
})

const selectName = (name: string) => {
  if (!name.includes('.')) fileNameInput.value = name + '.txt'
  else fileNameInput.value = name
}

const handleSave = () => {
  if (!fileNameInput.value) return
  emit('save', `C:/Users/Public/Desktop/${fileNameInput.value}`)
}
</script>

<style scoped>
.file-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.file-dialog-window {
  width: 500px;
  background: #f3f3f3;
  border: 1px solid #ccc;
  padding: 15px;
  border-radius: 6px;
}
.path-display {
  font-size: 12px;
  margin: 10px 0;
  background: #fff;
  padding: 4px;
  border: 1px solid #ddd;
}
.folder-view {
  height: 200px;
  background: #fff;
  border: 1px solid #ccc;
  overflow-y: auto;
  padding: 10px;
}
.vfs-item {
  padding: 4px 8px;
  cursor: pointer;
}
.vfs-item:hover {
  background: #e0e0e0;
}
.input-group {
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.input-group input {
  flex: 1;
  padding: 4px;
}
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.action-buttons button {
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid #bbb;
  cursor: pointer;
}
</style>
