<script setup lang="ts">
import SelectInput from './SelectInput.vue';
import InputLabel from './InputLabel.vue';
import { InformationCircleIcon } from '@heroicons/vue/24/solid';
import { useSettingsStore } from '../composables/settingsStore';

type Emits = {
  tutorial: []
}

defineEmits<Emits>();

const store = useSettingsStore();
</script>

<template>
  <div class="absolute top-6 right-4 shadow-2xl z-[250]">
    <div class="bg-white rounded text-gray-500 w-64 flex flex-col gap-2 dark:bg-slate-700 divide-y divide-gray-300 dark:divide-black">
      <div class="w-full p-2">
        <input-label value="Theme">
          <select-input name="theme" v-model="store.theme">
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select-input>
        </input-label>
      </div>
      <button type="button" @click="$emit('tutorial')" class="w-full p-2 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring focus:ring-blue-500 dark:hover:bg-slate-500 dark:active:bg-slate-400 dark:text-gray-200">
        <information-circle-icon class="w-5 h-5 inline" />
        Help
      </button>
    </div>
  </div>
</template>
