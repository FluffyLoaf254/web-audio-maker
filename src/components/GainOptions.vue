<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGraphStore } from '../composables/graphStore';
import { NodeData, Node } from '../types';
import { useNodeData } from '../composables/nodeData'
import AudioParam from './AudioParam.vue';

interface Props {
  id: string
}

const props = defineProps<Props>();

const node = ref<Node | null>(null);

const beats = ref(60);

const data = ref<NodeData>({
  gain: 1
});

useNodeData(props.id, node, data);

const store = useGraphStore();

onMounted(() => {
  if (node.value) {
    beats.value = store.inheritedBeats(node.value);
  }
});

const hasAudioParamInput = (param: string) => {
  return node.value?.audioParamInputs.some(item => item.input == param);
};
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <audio-param :disabled="hasAudioParamInput('gain')" v-model="data.gain" title="Gain" :beats="beats" :min="0" :max="10" :default="1" :defaultStart="0.0" algorithmDefault="x + 2 ^ (n / 2)" />
  </div>
</template>
