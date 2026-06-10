<template>
  <div class="text-editor">
    <div class="toolbar">
      <button @click="handleSave">💾 保存</button>
      <span class="file-path">{{ currentFilePath || '未命名文档.txt' }}</span>
    </div>
    <textarea v-model="content" spellcheck="false" placeholder="在此输入内容..."></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFileSystem } from '@/composables/useFileSystem'

const props = defineProps<{
  currentFilePath?: string
}>()

const { readFile, writeFile } = useFileSystem()
const content = ref('')

// 当组件挂载或路径改变时，读取文件内容
const loadFile = () => {
  if (props.currentFilePath) {
    const fileData = readFile(props.currentFilePath)
    content.value = fileData !== null ? fileData : ''
  } else {
    content.value = ''
  }
}

onMounted(loadFile)
watch(() => props.currentFilePath, loadFile)

const handleSave = () => {
  if (!props.currentFilePath) {
    alert('暂不支持系统级的另存为弹窗。请在资源管理器中新建文件后再打开。')
    return
  }
  writeFile(props.currentFilePath, content.value)
  alert('保存成功！') // 可以换成你自己系统的 Toast 提示
}
</script>

<style scoped>
.text-editor { display: flex; flex-direction: column; height: 100%; background: #fff; }
.toolbar { display: flex; align-items: center; padding: 6px; background: #f5f6f7; border-bottom: 1px solid #e1e1e1; }
.toolbar button { cursor: pointer; padding: 4px 12px; background: #fff; border: 1px solid #ccc; border-radius: 4px; margin-right: 12px;}
.toolbar button:hover { background: #e5f3ff; border-color: #0078d7; }
.file-path { font-size: 12px; color: #666; }
textarea { flex: 1; border: none; padding: 12px; font-family: Consolas, monospace; font-size: 14px; outline: none; resize: none; }
</style>