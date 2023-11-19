<script setup lang="ts">
import AudioGraph from './components/AudioGraph.vue';
import { useSettingsStore } from './composables/settingsStore';

const store = useSettingsStore();
</script>

<template>
  <div class="w-full h-full" :class="{ dark: store.dark }">
    <audio-graph />
  </div>
</template>
