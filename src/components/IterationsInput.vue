<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useStore } from '../store';
import { Node } from '../types';
import FormInput from './FormInput.vue';
import InputLabel from './InputLabel.vue';

interface Props {
  node: Node
}

const props = defineProps<Props>();

const store = useStore();

const iterations = ref(2);

const changeIterations = (iterations) => {
  if (iterations == '' || iterations < 0) {
    return;
  }
  
  store.commit('updateNodeMeta', { id: props.node.id, meta: { iterations: Math.floor(Number(iterations)) }});
};

onMounted(() => iterations.value = (props.node.meta.iterations || iterations.value))
</script>

<template>
  <form-input class="w-20" :name="'iterations-' + node.id" :id="'iterations-' + node.id" :model-value="iterations" @mousedown.stop @touchstart.stop @update:model-value="changeIterations" type="number" min="0" step="1" />
  <input-label value="Iterations" :for="'iterations-' + node.id" />
</template>
