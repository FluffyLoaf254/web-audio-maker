<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import AudioGraph from './components/AudioGraph.vue';
import { useSettingsStore } from './composables/settingsStore';

const store = useSettingsStore();
const { theme } = storeToRefs(store);

const dark = computed(() => theme.value == 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme.value == 'dark');
</script>

<template>
  <div id="app-content" class="w-full h-full" :class="{ dark: dark }">
    <audio-graph />
  </div>
</template>
