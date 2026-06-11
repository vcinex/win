<template>
  <div class="sidebar">
    <ul class="nav-tree">
      <li class="nav-group-title">主页</li>
      <li
        class="nav-item"
        :class="{ active: currentPath === 'C:/Users/Admin/Desktop' }"
        @click="navigateTo('C:/Users/Admin/Desktop')"
      >
        <span class="icon">🖥️</span>
        <span class="nav-text">桌面</span>
      </li>
      <li
        class="nav-item"
        :class="{ active: currentPath === 'C:/Users/Admin/Downloads' }"
        @click="navigateTo('C:/Users/Admin/Downloads')"
      >
        <span class="icon">⬇️</span>
        <span class="nav-text">下载</span>
      </li>
      <li
        class="nav-item"
        :class="{ active: currentPath === 'C:/Users/Admin/Documents' }"
        @click="navigateTo('C:/Users/Admin/Documents')"
      >
        <span class="icon">📄</span>
        <span class="nav-text">文档</span>
      </li>
      <li
        class="nav-item"
        :class="{ active: currentPath === 'C:/Users/Admin/Pictures' }"
        @click="navigateTo('C:/Users/Admin/Pictures')"
      >
        <span class="icon">🖼️</span>
        <span class="nav-text">图片</span>
      </li>
      <li
        class="nav-item"
        :class="{ active: currentPath === 'C:/Users/Admin/Music' }"
        @click="navigateTo('C:/Users/Admin/Music')"
      >
        <span class="icon">🎵</span>
        <span class="nav-text">音乐</span>
      </li>
      <li
        class="nav-item"
        :class="{ active: currentPath === 'C:/Users/Admin/Video' }"
        @click="navigateTo('C:/Users/Admin/Video')"
      >
        <span class="icon">📽️</span>
        <span class="nav-text">视频</span>
      </li>
      <li class="nav-spacer"></li>
      <li class="nav-item" :class="{ active: currentPath === '' }" @click="navigateTo('')">
        <span class="icon">💻</span>
        <span class="nav-text">此电脑</span>
      </li>
      <li
        class="nav-item sub-item"
        :class="{ active: currentPath === 'C:' }"
        @click="navigateTo('C:')"
      >
        <span class="icon">💽</span>
        <span class="nav-text">Windows (C:)</span>
      </li>
      <li
        class="nav-item sub-item"
        :class="{ active: currentPath === 'D:' }"
        @click="navigateTo('D:')"
      >
        <span class="icon">💽</span>
        <span class="nav-text">Data (D:)</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
interface Props {
  currentPath: string
}

defineProps<Props>()

const emit = defineEmits<{
  'navigate-to': [path: string]
}>()

// 创建一个处理导航的方法
const navigateTo = (path: string) => {
  emit('navigate-to', path)
}
</script>

<style scoped>
.sidebar {
  width: 160px;
  flex-shrink: 0; /* 关键：防止侧边栏被右侧内容挤压消失 */
  background-color: #f3f3f3;
  padding: 12px 8px;
  overflow-y: auto;
}

.nav-tree {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-group-title {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  margin: 8px 0 4px 12px;
}

.nav-spacer {
  height: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  margin-bottom: 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  position: relative;
}

.nav-item:hover {
  background-color: #eaeaea;
}

.nav-item.active {
  background-color: #e4e4e4;
  font-weight: 600;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 25%;
  height: 50%;
  width: 3px;
  background-color: #0067c0;
  border-radius: 4px;
}

.sub-item {
  padding-left: 32px;
}

.nav-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
