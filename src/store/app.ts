import { defineStore } from 'pinia';

import type { AppDefinition } from '@/types';

export const useAppStore = defineStore('apps', {
  state: () => ({
    appStates: new Map<string, AppDefinition>()
  }),

  getters: {
    appArray: (state): AppDefinition[] => Array.from(state.appStates.values())
  },

  actions: {
    registerApp(app: AppDefinition) {
      if (!app.id) return;
      this.appStates.set(app.id, app);
    },

    getApp(id: string): AppDefinition | undefined {
      return this.appStates.get(id);
    },

    listApps(): AppDefinition[] {
      return Array.from(this.appStates.values());
    }
  }
});
