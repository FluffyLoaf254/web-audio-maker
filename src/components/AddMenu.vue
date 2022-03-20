<template>
  <div class="flex flex-col bg-gray-50 w-64">
    <div class="w-64 p-2">
      <form-input v-model="input" class="w-full" placeholder="Search" />
    </div>
    <div class="w-64 overflow-y-auto flex flex-col divide-y divide-gray-300 max-h-full">
      <div type="button" v-for="node in foundNodes" :key="node.type" :disabled="$store.getters.numberOfType(node.type) >= node.max" @click="$emit('add', node)" :style="{ 'border-left-color': getCategoryOf(node).color }" class="cursor-pointer text-left p-3 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring focus:ring-blue-500 border-l-8 flex justify-between items-center">
        {{ node.name }}
        <icon-button @mousedown.stop @touchstart.stop @click.stop="showNote(node.note)">
          <information-circle-icon class="h-5 w-5" />
        </icon-button>
      </div>
    </div>
  </div>
</template>

<script>
  import FormInput from './FormInput.vue';
  import IconButton from './IconButton.vue';
  import { InformationCircleIcon } from '@heroicons/vue/solid';

  export default {
    components: {
      FormInput,
      IconButton,
      InformationCircleIcon,
    },

    emits: ['add'],

    data() {
      return {
        input: '',
      };
    },

    computed: {
      foundNodes() {
        return this.$store.state.nodes.filter(node => node.name.toLowerCase().includes(this.input.toLowerCase()));
      },
    },

    methods: {
      getCategoryOf(node) {
        return this.$store.getters.categoryOf(node);
      },
      showNote(note) {
        window.alert(note);
      },
    },
  };
</script>
