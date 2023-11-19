<script setup lang="ts">
import { useGraphStore } from '../composables/graphStore';
import { Node } from '../types';
import FormInput from './FormInput.vue';
import InputLabel from './InputLabel.vue';

interface Props {
  node: Node
}

const props = defineProps<Props>();

const store = useGraphStore();

const changeBeats = (beats) => {
  if (beats == '' || beats <= 0) {
    return;
  }
  
  store.updateNodeBeats({ id: props.node.id, beats: Number(beats) });
};
</script>

<template>
  <form-input class="w-20" :name="'beats-' + node.id" :id="'beats-' + node.id" :model-value="node.beats" @mousedown.stop @touchstart.stop @update:model-value="changeBeats" type="number" min="1" max="120" step="1" />
  <input-label value="Beats" :for="'beats-' + node.id" />
</template>
