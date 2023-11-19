import { defineStore } from 'pinia';

export interface State {
  theme: 'system' | 'dark' | 'light'
};

export const useSettingsStore = defineStore('settings', {
  state: (): State => ({
    theme: 'system',
  }),
});