<template>
  <div class="bg-white p-4 px-8 w-full flex justify-end gap-4 items-center">
    <icon-button @click="$emit('play')">
      <music-note-icon class="w-5 h-5" />
    </icon-button>
  </div>
</template>

<script>
  import IconButton from './IconButton.vue';
  import { MusicNoteIcon } from '@heroicons/vue/solid';

  export default {
    components: {
      IconButton,
      MusicNoteIcon,
    },

    emits: ['play'],
  };
</script>
