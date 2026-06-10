<template>
  <div class="editor-root">
    <div class="toolbar">
      <input v-model="filename" class="filename" placeholder="文件名 (例如: note.txt)" />
      <button title="新建" @click="newFile">新建</button>
      <button :disabled="!filename" title="保存" @click="save">保存</button>
      <select v-model="selected" class="file-list">
        <option v-for="f in files" :key="f" :value="f">{{ f }}</option>
      </select>
      <button :disabled="!selected" title="打开" @click="loadSelected">打开</button>
      <button :disabled="!selected" title="删除" @click="removeSelected">删除</button>
    </div>

    <textarea v-model="content" class="editor-area" spellcheck="false"></textarea>

    <div class="statusbar">
      <span>{{ filename || '未命名' }}</span>
      <span class="spacer"></span>
      <span>大小: {{ byteSize }} bytes</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFileSystem } from '@/composables'

const { files, readFile, writeFile, deleteFile, getMetadata, updateFileList } = useFileSystem()

const filename = ref('')
const content = ref('')
const selected = ref('')
const lastModified = ref<number | null>(null)

function save() {
  if (!filename.value) return
  writeFile(filename.value, content.value)
  updateFileList()
  selected.value = filename.value
}

function load(name: string) {
  const val = readFile(name)
  if (val === null) return

  const meta = getMetadata(name)
  lastModified.value = meta?.mtime || null

  filename.value = name
  content.value = val
}

function newFile() {
  filename.value = ''
  content.value = ''
  selected.value = ''
  lastModified.value = null
}

function loadSelected() {
  if (!selected.value) return
  load(selected.value)
}

function removeSelected() {
  if (!selected.value) return
  deleteFile(selected.value)
  if (filename.value === selected.value) {
    filename.value = ''
    content.value = ''
  }
  selected.value = ''
}

const byteSize = computed(() => new Blob([content.value]).size)

onMounted(() => {
  updateFileList()
})
</script>

<style scoped>
.editor-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(6, 10, 20, 0.6);
  border-radius: 10px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: rgba(15, 20, 35, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.filename {
  min-width: 180px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  color: #eef2ff;
}

.file-list {
  min-width: 160px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
  color: #eef2ff;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

button {
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  background: rgba(90, 124, 255, 0.14);
  color: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.editor-area {
  flex: 1;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  resize: none;
  color: #eaf0ff;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 14px;
  outline: none;
}

.statusbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(10, 14, 24, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.02);
  color: #9fb0e6;
  font-size: 12px;
}

.spacer {
  flex: 1;
}
</style>
