<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NodeData, Node } from '../types';
import { useStore } from '../store';
import { useNodeData } from '../composables/nodeData'
import InputLabel from './InputLabel.vue';
import SelectInput from './SelectInput.vue';
import AudioParam from './AudioParam.vue';

interface Props {
  id: string
}

const props = defineProps<Props>();

const node = ref<Node | null>(null);

const beats = ref(60);

const data = ref<NodeData>({
  type: 'lowpass',
  frequency: 350,
  detune: 0,
  Q: 1,
  gain: 0,
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
    <input-label value="Type">
      <select-input name="type" v-model="(data.type as string)">
        <option value="lowpass">Low-Pass</option>
        <option value="highpass">High-Pass</option>
        <option value="bandpass">Band-Pass</option>
        <option value="lowshelf">Low-Shelf</option>
        <option value="highshelf">High-Shelf</option>
        <option value="peaking">Peaking</option>
        <option value="notch">Notch</option>
        <option value="allpass">All-Pass</option>
      </select-input>
    </input-label>
    <audio-param :disabled="hasAudioParamInput('frequency')" v-model="data.frequency" title="Frequency" :default="440" :startDefault="262" algorithmDefault="x * 2 ^ (n / 12)" :beats="beats" :min="0" :max="20000" />
    <audio-param :disabled="hasAudioParamInput('detune')" v-model="data.detune" title="Detune" :default="0" :beats="beats" :min="0" :max="20000" algorithmDefault="x * 2 ^ (n / 12)" :startDefault="262" />
    <audio-param :disabled="hasAudioParamInput('Q')" v-model="data.Q" title="Q Factor" :beats="beats" :min="0.0001" :max="1000" :default="1" :defaultStart="0.0001" algorithmDefault="x + 2 ^ n" />
    <audio-param :disabled="hasAudioParamInput('gain')" v-model="data.gain" title="Gain" :beats="beats" :min="-40" :max="40" :default="0" :defaultStart="-40" algorithmDefault="x + 10 * n" :values="9" />
  </div>
</template>
