<script setup lang="ts">
import { ref } from 'vue';
import IconButton from './IconButton.vue';
import ToggleInput from './ToggleInput.vue';
import FormInput from './FormInput.vue';
import { MusicalNoteIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/solid';

interface Props {
  looping: boolean
}

type Emits = {
  play: []
  'update:looping': [looping: boolean]
  search: [input: string]
}

defineProps<Props>();

defineEmits<Emits>();

let input = ref('');
</script>

<template>
  <div class="bg-white py-4 px-4 md:px-8 w-full flex justify-between gap-4 items-center dark:bg-slate-700">
    <div class="flex gap-4 items-center" data-tutorial="Here, you can search for a node by name to reorient yourself in the graph in case you get lost.">
      <icon-button @click="$emit('search', input)" label="Search Nodes">
        <magnifying-glass-icon class="w-5 h-5" />
      </icon-button>
      <form-input name="node-search" class="w-36" placeholder="Find" v-model="input" @keyup.enter="$emit('search', input)" />
    </div>
    <div class="flex gap-4 items-center">
      <icon-button @click="$emit('play')" data-tutorial="Begin playback of the whole audio graph. There are also buttons to play just a single node or even all nodes in the graph up to a given node." label="Play Graph">
        <musical-note-icon class="w-5 h-5" />
      </icon-button>
      <label class="flex items-center gap-4" data-tutorial="Use this control to enable looping of the playback.">
        <toggle-input name="looping" :checked="looping" @update:checked="(value: boolean) => $emit('update:looping', value)" />
        <arrow-path-icon class="w-5 h-5" :class="{ 'text-gray-500 dark:text-gray-200': !looping, 'text-blue-500 dark:text-blue-400': looping }" />
      </label>
    </div>
  </div>
</template>
