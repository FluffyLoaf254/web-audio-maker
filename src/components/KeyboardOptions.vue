<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import SelectInput from './SelectInput.vue';
import InputLabel from './InputLabel.vue';
import { evaluate } from 'mathjs';
import { NodeData, Node, ComplexDataItem, BeatTransition } from '../types';
import { useNodeData } from '../composables/nodeData'

interface Props {
  id: string
}

const props = defineProps<Props>();

const node = ref<Node | null>(null);

const meta = ref({
  attack: 'constant',
  notes: [],
});

const data = ref<NodeData>({
  frequency: {
    start: 27.5,
    algorithm: 'x * 2 ^ (n / 12)',
    values: 88,
    array: [],
  },
  gain: {
    start: 0,
    algorithm: 'x + n',
    values: 2,
    array: [],
  },
});

const convertPixelsToRem = (pixels: number): number => {
  return pixels / parseFloat(getComputedStyle(document.documentElement).fontSize);
};

const addValue = (value) => {
  meta.value.notes.push(value);
};

const removeValue = (value) => {
  meta.value.notes = meta.value.notes.filter(note => {
    for (let property in value) {
      if (note[property] != value[property]) {
        return true;
      }
    }

    return false;
  });
};

const hasValue = (value) => {
  return meta.value.notes.some(note => {
    for (let property in value) {
      if (note[property] != value[property]) {
        return false;
      }
    }

    return true;
  });
};

const toggleNote = (event) => {
  const beat = Math.round(convertPixelsToRem(event.offsetX / 2) + 0.5);
  const index = Math.round(values.value - (convertPixelsToRem(event.offsetY / 2) + 0.5));
  if (!hasValue({ index, beat })) {
    if (hasValue({ beat })) {
      removeValue({ beat });
    }
    nextTick(() => addValue({ index, beat }));
  } else {
    removeValue({ beat });
  }
};

const generateValue = (algorithm: string, start: number, index: number) => {
  try {
    return evaluate(algorithm, { x: start, n: index - 1 });
  } catch (error) {
    return 0;
  }
};

const values = ref(88);

watch(meta, (value: any) => {
  let frequency = data.value.frequency as ComplexDataItem;
  frequency.array = value.notes.map(item => ({
    beat: item.beat * 2 - 1,
    index: item.index,
    value: generateValue(frequency.algorithm, frequency.start, item.index),
    transition: 'constant',
  }));
  let gain = data.value.gain as ComplexDataItem;
  let gainArray = [];
  let maxBeat = 1;
  for (let item of value.notes) {
    gainArray.push({
      beat: item.beat * 2 - 1,
      index: 1,
      value: gain.start,
      transition: value.attack as BeatTransition,
    });
    gainArray.push({
      beat: item.beat * 2,
      index: 2,
      value: generateValue(gain.algorithm, gain.start, 2),
      transition: value.attack as BeatTransition,
    });
    maxBeat = item.beat * 2;
  }
  gainArray.push({
    beat: maxBeat + 1,
    index: 1,
    value: gain.start,
    transition: value.attack as BeatTransition,
  });
  gain.array = gainArray;
}, { deep: true });

const viewBox = computed(() => {
  return '0 0 ' + node.value.beats + ' ' + values.value * 2;
});

useNodeData(props.id, node, data, meta);
</script>

<template>
  <div class="flex flex-col gap-4 p-4 h-full">
    <input-label value="Attack">
      <select-input name="attack" v-model="(meta.attack as string)">
        <option value="constant">Constant</option>
        <option value="linear">Linear</option>
        <option value="exponential">Exponential</option>
      </select-input>
    </input-label>
    <div class="relative overflow-x-scroll overflow-y-scroll bg-white w-full border-4 border-slate-300">
      <div class="relative bg-repeat cursor-pointer" :style="{ height: values * 2 + 'rem', width: node.beats + 'rem' }" @click="toggleNote($event)" style="background-size: 2rem 2rem; background-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.1) 0, rgba(0, 0, 0, 0.1) 0.5rem, transparent 0.5rem);">
        <svg :viewBox="viewBox" :width="(node.beats / 2) * 32" :height="values * 32">
          <transition-group name="fade">
            <circle v-for="note in meta.notes" :key="JSON.stringify(note)" :cx="(Number(note.beat) - 0.5) * 2" :cy="(values - (note.index + 0.5)) * 2" r="0.5" fill="transparent" stroke-width="0.4" stroke="hsl(200, 70%, 70%)" />
          </transition-group>
        </svg>
      </div>
    </div>
  </div>
</template>
