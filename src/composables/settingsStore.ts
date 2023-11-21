import { defineStore } from 'pinia';

export interface State {
  theme: 'system' | 'dark' | 'light'
};

export const useSettingsStore = defineStore('settings', {
  state: (): State => ({
    theme: 'system',
  }),
  getters: {
    dark: (state: State) => state.theme == 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : state.theme == 'dark',
  }
});
