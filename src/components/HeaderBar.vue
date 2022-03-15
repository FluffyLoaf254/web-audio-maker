<template>
  <div class="bg-white p-4 px-8 w-full flex gap-4 justify-between items-center">
    <h1 class="text-blue-500 text-xl font-semibold">
      <slot></slot>
    </h1>
    <div class="flex gap-4 items-center">
      <form-input id="bpm" v-model="bpm" type="number" min="1" max="1000" step="1" />
      <input-label value="BPM" for="bpm" />
      <icon-button>
        <information-circle-icon class="w-5 h-5" />
      </icon-button>
    </div>
  </div>
</template>

<script>
  import IconButton from './IconButton.vue';
  import InputLabel from './InputLabel.vue';
  import FormInput from './FormInput.vue';
  import { InformationCircleIcon } from '@heroicons/vue/solid';

  export default {
    components: {
      IconButton,
      InputLabel,
      FormInput,
      InformationCircleIcon,
    },

    emits: ['change-bpm'],

    data() {
      return {
        bpm: 120,
      };
    },

    watch: {
      bpm(value) {
        this.$emit('change-bpm', value);
      },
    },
  };
</script>
