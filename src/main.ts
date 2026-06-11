import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

let isPersistent = await navigator.storage.persisted()
if (!isPersistent) {
  isPersistent = await navigator.storage.persist()
  if (!isPersistent) {
    console.warn('持久存储授权失败，存在自动清理风险')
  }
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
