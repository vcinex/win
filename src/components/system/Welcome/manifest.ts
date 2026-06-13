import { useAppStore } from '@/store';

const appStore = useAppStore();
appStore.registerApp({
  id: 'hello-world',
  name: 'Welcome',
  icon: '🌐',
  component: () => import('./index.vue'),
  defaultSize: { width: 560, height: 420 },
  single: false
});
