import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url' // 引入 Node 内置模块

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 将 '@' 映射到当前目录下的 'src' 文件夹
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
