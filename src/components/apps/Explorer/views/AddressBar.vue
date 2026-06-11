<template>
  <div class="address-bar">
    <!-- 导航按钮组 -->
    <div class="nav-button-group">
      <button
        class="nav-button"
        title="后退 (Alt+左箭头)"
        :disabled="!canGoBack"
        @click="$emit('go-back')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        class="nav-button"
        title="前进 (Alt+右箭头)"
        :disabled="!canGoForward"
        @click="$emit('go-forward')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      <button class="nav-button" title="向上 (Alt+向上箭头)" @click="$emit('go-up')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m7 15 5-5 5 5" />
        </svg>
      </button>
      <button class="nav-button" title="刷新 (F5)" @click="$emit('force-refresh')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
      </button>
    </div>

    <!-- 地址栏 -->
    <div class="address-input-container">
      <!-- 显示模式 -->
      <div v-if="!isEditingPath" class="path-display" @dblclick="startEditing">
        <span v-if="currentPath === ''" class="path-root">此电脑</span>

        <template v-for="(segment, index) in displaySegments" :key="index">
          <span v-if="index > 0" class="separator">›</span>
          <span class="path-segment" :title="'跳转到 ' + segment" @click="navigateToSegment(index)">
            {{ segment }}
          </span>
        </template>
      </div>

      <!-- 编辑模式 -->
      <div v-else class="path-edit">
        <input
          ref="pathInputRef"
          v-model="localPathInput"
          type="text"
          class="path-input"
          placeholder="输入完整路径..."
          @blur="finishEditing"
          @keyup.enter="finishEditing"
          @keyup.esc="cancelEditing"
        />
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-container">
      <input
        type="text"
        class="search-input"
        placeholder="搜索"
        @focus="$emit('search-focus')"
        @input="$emit('search-change', $event.target.value)"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="search-icon"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// 定义 props
const props = defineProps({
  currentPath: {
    type: String,
    default: ''
  },
  pathSegments: {
    type: Array,
    default: () => []
  },
  isEditingPath: {
    type: Boolean,
    default: false
  },
  pathInput: {
    type: String,
    default: ''
  },
  canGoBack: {
    type: Boolean,
    default: false
  },
  canGoForward: {
    type: Boolean,
    default: false
  }
})

// 定义 emits
const emit = defineEmits([
  'navigate-to',
  'navigate-to-segment',
  'go-up',
  'go-back',
  'go-forward',
  'start-editing-path',
  'submit-path',
  'force-refresh',
  'update:pathInput',
  'search-focus',
  'search-change'
])

// 本地响应式变量用于编辑
const localPathInput = ref(props.pathInput)
const pathInputRef = ref(null)

// 计算属性：显示的路径段（处理"此电脑"的情况）
const displaySegments = computed(() => {
  if (props.currentPath === '') return [] // 当路径为空时，不显示任何段，因为已在前面显示"此电脑"
  return props.pathSegments.filter((segment) => segment !== '')
})

// 监听 props.pathInput 的变化，同步到本地变量
watch(
  () => props.pathInput,
  (newVal) => {
    localPathInput.value = newVal
  },
  { immediate: true }
)

// 暴露方法供父组件调用
defineExpose({
  focusPathInput: () => {
    nextTick(() => {
      if (pathInputRef.value) {
        pathInputRef.value.focus()
        pathInputRef.value.select()
      }
    })
  }
})

// 开始编辑路径
const startEditing = () => {
  localPathInput.value = props.currentPath || props.pathInput
  emit('start-editing-path')
}

// 完成编辑路径
const finishEditing = () => {
  emit('update:pathInput', localPathInput.value)
  emit('submit-path')
}

// 取消编辑（按ESC键）
const cancelEditing = () => {
  localPathInput.value = props.currentPath
  emit('update:pathInput', props.currentPath)
  emit('submit-path')
}

// 跳转到特定段
const navigateToSegment = (index) => {
  emit('navigate-to-segment', index)
}
</script>

<style scoped>
.address-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f0f0f0;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  gap: 8px;
}

.nav-button-group {
  display: flex;
  gap: 4px;
}

.nav-button {
  width: 32px;
  height: 24px;
  padding: 4px;
  background-color: #f0f0f0;
  border: 0px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.nav-button:hover:not(:disabled) {
  background-color: #e5e5e5;
}

.nav-button:active:not(:disabled) {
  background-color: #d9d9d9;
}

.nav-button:disabled {
  color: #aaa;
  cursor: not-allowed;
}

.address-input-container {
  flex: 1;
  min-width: 0;
  height: 28px;
  background-color: white;
  border: 0px solid #ccc;
  border-radius: 4px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.path-display {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.path-root {
  font-weight: 500;
  color: #0078d7;
  margin-right: 8px;
  white-space: nowrap;
}

.path-segment {
  padding: 2px 4px;
  cursor: pointer;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.path-segment:hover {
  background-color: #e6f2ff;
  color: #0078d7;
}

.separator {
  margin: 0 6px;
  color: #666;
  font-size: 12px;
}

.path-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  font-size: 13px;
}

.search-container {
  position: relative;
  margin-right: 0px;
}

.search-input {
  height: 28px;
  padding: 0 30px 0 10px;
  border: 0px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  background-color: white;
}

.search-input:focus {
  outline: none;
  border-color: #0078d7;
  box-shadow: 0 0 0 2px rgba(0, 120, 215, 0.2);
}

.search-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.path-edit {
  width: 100%;
  height: 100%;
}
</style>
