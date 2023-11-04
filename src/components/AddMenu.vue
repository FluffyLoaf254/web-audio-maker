<template>
  <div class="flex flex-col bg-gray-50 w-64">
    <div class="w-64 p-2">
      <form-input name="node-types-search" v-model="input" class="w-full" placeholder="Search" />
    </div>
    <div class="w-64 overflow-y-auto flex flex-col divide-y divide-gray-300 max-h-full">
      <button type="button" v-for="node in foundNodes" :key="node.type" :disabled="$store.getters.numberOfType(node.type) >= node.max" @click="$emit('add', node)" :style="{ 'border-left-color': getCategoryOf(node).color }" class="cursor-pointer text-left p-3 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring focus:ring-blue-500 border-l-8 flex justify-between items-center">
        {{ node.name }}
        <icon-button @mousedown.stop @touchstart.stop @click.stop="showNote($event, node.note)">
          <information-circle-icon class="h-5 w-5" />
        </icon-button>
      </button>
      <message-modal @close="note = false;" :show="Boolean(note)" :parent="noteParent">{{ note }}</message-modal>
    </div>
  </div>
</template>

<script>
  import FormInput from './FormInput.vue';
  import MessageModal from './MessageModal.vue';
  import IconButton from './IconButton.vue';
  import { InformationCircleIcon } from '@heroicons/vue/24/solid';

  export default {
    components: {
      FormInput,
      MessageModal,
      IconButton,
      InformationCircleIcon,
    },

    emits: ['add'],

    data() {
      return {
        input: '',
        note: false,
        noteParent: null,
      };
    },

    computed: {
      foundNodes() {
        return this.$store.state.nodeTypes.filter(node => node.name.toLowerCase().includes(this.input.toLowerCase()));
      },
    },

    methods: {
      getCategoryOf(node) {
        return this.$store.getters.categoryOf(node);
      },
      showNote(event, note) {
        this.noteParent = event.target;
        this.note = note;
      },
    },
  };
</script>
