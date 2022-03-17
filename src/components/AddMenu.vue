<template>
  <div class="flex flex-col bg-gray-50 w-64">
    <div class="p-3">
      <form-input v-model="input" class="w-full" placeholder="Search..." />
    </div>
    <div class="overflow-y-auto flex flex-col divide-y divide-gray-300 max-h-full">
      <button type="button" v-for="node in foundNodes" :key="node.type" :disabled="$store.getters.numberOfType(node.type) >= node.max" @click="$emit('add', node)" :style="{ 'border-left-color': getCategoryOf(node).color }" class="cursor-pointer text-left p-3 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring focus:ring-blue-500 border-l-8">
        {{ node.name }}
      </button>
    </div>
  </div>
</template>

<script>
  import FormInput from './FormInput.vue';

  export default {
    components: {
      FormInput,
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
    },
  };
</script>
