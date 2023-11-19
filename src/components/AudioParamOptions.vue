<script setup lang="ts">
import { ref } from 'vue';
import { NodeData, Node } from '../types';
import { useNodeData } from '../composables/nodeData'
import AudioParam from './AudioParam.vue';

interface Props {
  id: string
}

const props = defineProps<Props>();

const node = ref<Node | null>(null);

const data = ref<NodeData>({
  output: 0
});

useNodeData(props.id, node, data);
</script>
  
<template>
  <div class="flex flex-col gap-4 p-4">
    <audio-param v-model="data.output" title="Data" :beats="node?.beats" :min="0" :max="20000" />
  </div>
</template>
