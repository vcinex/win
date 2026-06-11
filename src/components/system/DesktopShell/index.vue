<template>
  <div class="desktop-shell" @contextmenu="handleDesktopContextMenu">
    <div class="desktop-grid">
      <div
        v-for="icon in desktopIcons"
        :key="icon.name"
        class="desktop-icon"
        @dblclick="open(icon)"
      >
        <img :src="getAppIcon(icon.appId)" />
        <span>{{ icon.name }}</span>
      </div>
    </div>

    <Window v-for="[pid, process] in store.processes" :key="pid" :pid="pid" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fs } from '../../../services/fs'
import { appRegistry } from '../../../services/appRegistry'
import { useSystemManager } from '../../../composables/useSystemManager'
import { useContextMenu } from '../../../composables/useContextMenu'
import Window from '../Window/index.vue'
import { useWindowStore } from '../../../store/windows'

const sys = useSystemManager()
const store = useWindowStore()
const { showMenu } = useContextMenu()

const desktopIcons = ref<any[]>([])

onMounted(async () => {
  // 异步读取虚拟文件系统中的桌面文件夹
  try {
    desktopIcons.value = await fs.readDir('C:/Users/Public/Desktop')
  } catch (e) {
    console.error('加载桌面图标失败', e)
  }
})

const getAppIcon = (appId: string) => appRegistry[appId]?.icon || '/icons/default.svg'

const open = (iconData: any) => {
  sys.openApp(iconData.appId, { path: iconData.path })
}

const handleDesktopContextMenu = (e: MouseEvent) => {
  showMenu(e, [
    { label: '查看 (V)', action: () => console.log('查看') },
    { label: '排序方式 (O)', action: () => console.log('排序') },
    { label: '刷新 (E)', divided: true, action: () => window.location.reload() },
    { label: '新建 (W)', action: () => console.log('新建') },
    { label: '个性化 (R)', action: () => sys.openApp('settings') }
  ])
}
</script>

<style scoped>
.desktop-shell {
  width: 100vw;
  height: calc(100vh - 48px); /* 留出任务栏空间 */
  position: relative;
  overflow: hidden;
}
.desktop-grid {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: flex-start;
  height: 100%;
  padding: 10px;
  gap: 10px;
}
.desktop-icon {
  width: 74px;
  height: 74px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  cursor: default;
}
.desktop-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}
.desktop-icon img {
  width: 32px;
  height: 32px;
  margin-bottom: 5px;
}
.desktop-icon span {
  font-size: 12px;
  text-align: center;
  word-break: break-all;
}
</style>
