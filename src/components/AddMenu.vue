<script setup lang="ts">
import { type NodeType } from '../types';
import { ref, computed } from 'vue';
import { useGraphStore } from '../composables/graphStore';
import FormInput from './FormInput.vue';
import MessageModal from './MessageModal.vue';
import IconButton from './IconButton.vue';
import { InformationCircleIcon } from '@heroicons/vue/24/solid';

type Emits = {
  add: [type: any]
}

defineEmits<Emits>()

let input = ref('');
let currentNote = ref('');
let currentNoteParent = ref<HTMLElement|null>(null);

const store = useGraphStore();

const foundTypes = computed(() => {
  return store.nodeTypes.filter(node => node.name.toLowerCase().includes(input.value.toLowerCase()));
});

const getCategoryOf = (type: NodeType) => {
  return store.categoryOf(type);
};
const numberOfType = (type: string) => {
  return store.numberOfType(type);
};
const showNote = (event: MouseEvent, note: string) => {
  currentNoteParent.value = event.target as HTMLElement;
  currentNote.value = note;
};
</script>

<template>
  <div class="flex flex-col bg-gray-50 w-64">
    <div class="w-64 p-2">
      <form-input name="node-types-search" v-model="input" class="w-full" placeholder="Search" />
    </div>
    <div class="w-64 overflow-y-auto flex flex-col divide-y divide-gray-300 max-h-full">
      <button type="button" v-for="nodeType in foundTypes" :key="nodeType.type" :disabled="numberOfType(nodeType.type) >= nodeType.max" @click="$emit('add', nodeType)" :style="{ 'border-left-color': getCategoryOf(nodeType)?.color ?? 'black' }" class="cursor-pointer text-left p-3 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 hover:bg-gray-100 active:bg-gray-200 border-l-8 flex justify-between items-center focus:outline-none focus:ring focus:ring-inset focus:ring-blue-500">
        {{ nodeType.name }}
        <icon-button @mousedown.stop @touchstart.stop @click.stop="showNote($event, nodeType.note)" label="Node Type Information">
          <information-circle-icon class="h-5 w-5" />
        </icon-button>
      </button>
      <message-modal @close="currentNote = '';" :show="currentNote != ''" :parent="currentNoteParent">{{ currentNote }}</message-modal>
    </div>
  </div>
</template>
