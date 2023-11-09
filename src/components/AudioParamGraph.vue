<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { evaluate } from 'mathjs';
import { Beat } from '../types';

interface Props {
  values: number
  start: number
  beats: number
  algorithm: string
  modelValue: Beat[]
}

const props = defineProps<Props>();

type Emits = {
  'update:modelValue': [value: Beat[]]
}

const emit = defineEmits<Emits>();

const viewBox = computed(() => {
  return '0 0 ' + props.beats * 2 + ' ' + props.values * 2;
});

const convertPixelsToRem = (pixels: number): number => {
  return pixels / parseFloat(getComputedStyle(document.documentElement).fontSize);
};

const addValue = (value) => {
  let array = [...props.modelValue];
  array.push(value);
  updateValue(array);
};

const removeValue = (value) => {
  let array = [...props.modelValue];
  array = array.filter(note => {
    for (let property in value) {
      if (note[property] != value[property]) {
        return true;
      }
    }

    return false;
  });
  updateValue(array);
};

const hasValue = (value) => {
  return props.modelValue.some(note => {
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
  const index = Math.round(props.values - (convertPixelsToRem(event.offsetY / 2) + 0.5));
  const value = generateValue(index);
  if (!hasValue({ index, beat })) {
    if (hasValue({ beat })) {
      removeValue({ beat });
    }
    nextTick(() => addValue({ value, index, beat }));
  } else {
    removeValue({ beat });
  }
};

const generateValue = (index: number) => {
  try {
    return evaluate(props.algorithm, { x: props.start, n: index - 1 });
  } catch (error) {
    return 0;
  }
};

const updateValue = (value) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <div class="relative overflow-x-scroll overscroll-y-auto bg-white w-full" ref="graph">
    <div class="relative bg-repeat cursor-pointer" :style="{ height: values * 2 + 'rem', width: beats * 2 + 'rem' }" @click="toggleNote($event)" style="background-size: 2rem 2rem; background-image: radial-gradient(circle at center, transparent 0, transparent 0.6rem, rgba(0, 0, 0, 0.2) 0.6rem, rgba(0, 0, 0, 0.2) 0.8rem, transparent 0.8rem);">
      <svg :viewBox="viewBox" :width="beats * 32" :height="values * 32">
        <transition-group name="fade">
          <circle v-for="value in modelValue" :key="JSON.stringify(value)" :cx="(Number(value.beat) - 0.5) * 2" :cy="(values - (value.index + 0.5)) * 2" r="0.5" fill="transparent" stroke-width="0.4" stroke="hsl(0, 70%, 70%)" />
        </transition-group>
      </svg>
    </div>
  </div>
</template>