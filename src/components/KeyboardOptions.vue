<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import SelectInput from './SelectInput.vue';
import InputLabel from './InputLabel.vue';
import { evaluate } from 'mathjs';
import { NodeData, Node, ComplexDataItem, BeatTransition } from '../types';
import { useNodeData } from '../composables/nodeData'
import { useNodeMeta } from '../composables/nodeMeta';

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
    beat: item.beat,
    index: item.index,
    value: generateValue(frequency.algorithm, frequency.start, item.index),
    transition: 'constant',
  }));
  let gain = data.value.gain as ComplexDataItem;
  let gainArray = [];
  for (let item of value.notes) {
    gainArray.push({
      beat: item.beat,
      index: 1,
      value: gain.start,
      transition: value.attack as BeatTransition,
    });
    gainArray.push({
      beat: item.beat + 0.05,
      index: 2,
      value: generateValue(gain.algorithm, gain.start, 2),
      transition: value.attack as BeatTransition,
    });
    gainArray.push({
      beat: item.beat + 0.95,
      index: 2,
      value: generateValue(gain.algorithm, gain.start, 2),
      transition: value.attack as BeatTransition,
    });
    gainArray.push({
      beat: item.beat + 1,
      index: 1,
      value: gain.start,
      transition: value.attack as BeatTransition,
    });
  }
  gain.array = gainArray;
}, { deep: true });

const viewBox = computed(() => {
  return '0 0 ' + node.value.beats * 2 + ' ' + values.value * 2;
});

useNodeData(props.id, node, data);
useNodeMeta(props.id, node, meta);
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
    <div class="relative overflow-x-scroll overflow-y-scroll flex bg-white w-full border-4 border-slate-300">
      <div class="min-w-[6rem] border-r-4 border-slate-500 bg-repeat" :style="{ height: values * 2 + 'rem' }" style="background-size: 9rem 24rem; background-image: linear-gradient(to top, white 0, white 1.9rem, rgba(0, 0, 0, 0.4) 1.9rem, rgba(0, 0, 0, 0.4) 2rem, rgba(0, 0, 0, 0.8) 2rem, rgba(0, 0, 0, 0.8) 3.9rem, rgba(0, 0, 0, 0.4) 3.9rem, rgba(0, 0, 0, 0.4) 4rem, white 4rem, white 5.9rem, rgba(0, 0, 0, 0.4) 5.9rem, rgba(0, 0, 0, 0.4) 6rem, white 6rem, white 7.9rem, rgba(0, 0, 0, 0.4) 7.9rem, rgba(0, 0, 0, 0.4) 8rem, rgba(0, 0, 0, 0.8) 8rem, rgba(0, 0, 0, 0.8) 9.9rem, rgba(0, 0, 0, 0.4) 9.9rem, rgba(0, 0, 0, 0.4) 10rem, white 10rem, white 11.9rem, rgba(0, 0, 0, 0.4) 11.9rem, rgba(0, 0, 0, 0.4) 12rem,  rgba(0, 0, 0, 0.8) 12rem, rgba(0, 0, 0, 0.8) 13.9rem, rgba(0, 0, 0, 0.4) 13.9rem, rgba(0, 0, 0, 0.4) 14rem, white 14rem, white 15.9rem, rgba(0, 0, 0, 0.4) 15.9rem, rgba(0, 0, 0, 0.4) 16rem, white 16rem, white 17.9rem, rgba(0, 0, 0, 0.4) 17.9rem, rgba(0, 0, 0, 0.4) 18rem, rgba(0, 0, 0, 0.8) 18rem, rgba(0, 0, 0, 0.8) 19.9rem, rgba(0, 0, 0, 0.4) 19.9rem, rgba(0, 0, 0, 0.4) 20rem, white 20rem, white 21.9rem, rgba(0, 0, 0, 0.4) 21.9rem, rgba(0, 0, 0, 0.4) 22rem,  rgba(0, 0, 0, 0.8) 22rem, rgba(0, 0, 0, 0.8) 23.9rem, rgba(0, 0, 0, 0.4) 23.9rem)"></div>
      <div class="cursor-pointer" :style="{ height: values * 2 + 'rem', width: node.beats * 2 + 'rem' }" @click="toggleNote($event)" style="background-repeat: repeat, repeat; background-size: 100% 4rem, 2rem 2rem; background-image: linear-gradient(to top, transparent 0, transparent 2rem, rgba(0, 0, 0, 0.05) 2rem, rgba(0, 0, 0, 0.05) 4rem), radial-gradient(circle at center, rgba(0, 0, 0, 0.1) 0, rgba(0, 0, 0, 0.1) 0.5rem, transparent 0.5rem);">
        <svg :viewBox="viewBox" :width="node.beats * 32" :height="values * 32">
          <transition-group name="fade">
            <circle v-for="note in meta.notes" :key="JSON.stringify(note)" :cx="(Number(note.beat) - 0.5) * 2" :cy="(values - (note.index + 0.5)) * 2" r="0.5" fill="transparent" stroke-width="0.4" stroke="hsl(200, 70%, 70%)" />
          </transition-group>
        </svg>
      </div>
    </div>
  </div>
</template>
