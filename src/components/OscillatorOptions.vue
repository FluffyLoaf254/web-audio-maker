<script setup lang="ts">
import { ref } from 'vue';
import { NodeData, Node } from '../types';
import { useNodeData } from '../composables/nodeData'
import SelectInput from './SelectInput.vue';
import InputLabel from './InputLabel.vue';
import AudioParam from './AudioParam.vue';

interface Props {
  id: string
}

const props = defineProps<Props>();

const node = ref<Node | null>(null);

const data = ref<NodeData>({
  type: 'sine',
  frequency: 440,
  detune: 0,
});

useNodeData(props.id, node, data);

const hasAudioParamInput = (param: string) => {
  return node.value?.audioParamInputs.some(item => item.input == param);
};
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <input-label value="Type">
      <select-input name="type" v-model="(data.type as string)">
        <option value="sine">Sine</option>
        <option value="square">Square</option>
        <option value="sawtooth">Sawtooth</option>
        <option value="triangle">Triangle</option>
      </select-input>
    </input-label>
    <audio-param :disabled="hasAudioParamInput('frequency')" v-model="data.frequency" title="Frequency" :default="440" :startDefault="262" algorithmDefault="x * 2 ^ (n / 12)" :beats="node?.beats" :min="0" :max="20000" />
    <audio-param :disabled="hasAudioParamInput('detune')" v-model="data.detune" title="Detune" :default="0" :beats="node?.beats" :min="0" :max="20000" :startDefault="262" algorithmDefault="x * 2 ^ (n / 12)" />
  </div>
</template>
