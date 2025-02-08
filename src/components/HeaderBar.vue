<script setup lang="ts">
import { ref } from 'vue';
import IconButton from './IconButton.vue';
import InputLabel from './InputLabel.vue';
import FormInput from './FormInput.vue';
import SettingsMenu from './SettingsMenu.vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/solid';

interface Props {
  bpm: number
}

type Emits = {
  tutorial: []
  'update:bpm': [bpm: number]
}

defineProps<Props>();

defineEmits<Emits>();

const settingsOpen = ref(false);
</script>

<template>
  <div class="bg-white dark:bg-slate-700 py-4 px-4 md:px-8 w-full flex gap-4 justify-between items-center">
    <h1 class="text-blue-500 dark:text-blue-400 text-xl font-semibold">
      <slot></slot>
    </h1>
    <div class="flex gap-4 items-center">
      <form-input name="bpm" class="w-20" id="bpm" :model-value="bpm" @update:model-value="(value: string | number) => $emit('update:bpm', Number(value))" type="number" min="1" max="1000" step="1" data-tutorial="Here, set the beats per minute of the audio graph. This can be changed on-the-fly." />
      <input-label value="BPM" for="bpm" />
      <icon-button @click="settingsOpen = !settingsOpen" label="Guided Tutorial">
        <cog6-tooth-icon class="w-5 h-5" />
      </icon-button>
      <div class="relative">
        <settings-menu v-if="settingsOpen" @tutorial="$emit('tutorial')" @mouseleave="settingsOpen = false" @focusout="settingsOpen = false" />
      </div>
    </div>
  </div>
</template>
