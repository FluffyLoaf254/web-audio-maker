
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStore } from '../store';
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
  delayTime: 0
});

useNodeData(props.id, node, data);

const store = useStore();

onMounted(() => beats.value = store.getters.inheritedBeats(node.value));

const hasAudioParamInput = (param: string) => {
  return node.value.audioParamInputs.some(item => item.input == param);
};
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <audio-param :disabled="hasAudioParamInput('delayTime')" v-model="data.delayTime" title="Delay" :beats="beats" :min="0" :max="1" :default="1" :defaultStart="0.0" :values="10" algorithmDefault="x + n * 0.1" />
  </div>
</template>
