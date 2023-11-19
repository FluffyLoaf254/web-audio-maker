<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { evaluate } from 'mathjs';
import { Beat, BeatTransition } from '../types';

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

const transition = ref<BeatTransition>('constant')

const viewBox = computed(() => {
  return '0 0 ' + props.beats * 2 + ' ' + props.values * 2;
});

const convertPixelsToRem = (pixels: number): number => {
  return pixels / parseFloat(getComputedStyle(document.documentElement).fontSize);
};

const addValue = (value: Beat) => {
  let array = [...props.modelValue];
  array.push(value);
  updateValue(array);
};

const removeValue = (value: Partial<Beat>) => {
  let array = [...props.modelValue];
  array = array.filter(note => {
    for (let property in value) {
      if (note[property as keyof Beat] != value[property as keyof Beat]) {
        return true;
      }
    }

    return false;
  });
  updateValue(array);
};

const hasValue = (value: Partial<Beat>) => {
  return props.modelValue.some(note => {
    for (let property in value) {
      if (note[property as keyof Beat] != value[property as keyof Beat]) {
        return false;
      }
    }

    return true;
  });
};

const toggleNote = (event: MouseEvent) => {
  const beat = Math.round(convertPixelsToRem(event.offsetX / 2) + 0.5);
  const index = Math.round(props.values - (convertPixelsToRem(event.offsetY / 2) + 0.5));
  const value = generateValue(index);
  if (!hasValue({ index, beat })) {
    if (hasValue({ beat })) {
      removeValue({ beat });
    }
    nextTick(() => addValue({ value, index, beat, transition: transition.value }));
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

const generatePath = (values: Beat[]) => {
  let path = 'M 0 ' + (props.values - 0.5) * 2 + ' H 1';
  let previousIndex = 0;
  for (let value of values.sort((a, b) => a.beat - b.beat)) {
    switch (value.transition) {
      case 'constant':
        path += ' H ' + (value.beat - 0.5) * 2;
        path += ' V ' + (props.values - (value.index + 0.5)) * 2;
        break;
      case 'linear':
        path += ' L ' + (value.beat - 0.5) * 2 + ' ' + (props.values - (value.index + 0.5)) * 2;
        break;
      case 'exponential':
        path += ' C ' + (value.beat - 0.5) * 2 + ' ' + (props.values - (previousIndex + 0.5)) * 2 + ',' + (value.beat - 0.5) * 2 + ' ' + (props.values - (value.index + 0.5)) * 2 + ',' + (value.beat - 0.5) * 2 + ' ' + (props.values - (value.index + 0.5)) * 2;
        break;
    }
    previousIndex = value.index;
  }
  path += ' H ' + (props.beats + 0.5) * 2;
  return path;
}

const generateStroke = (value: Beat) => {
  switch (value.transition) {
    case 'constant':
      return 'hsl(0, 70%, 70%)';
    case 'linear':
      return 'hsl(140, 70%, 70%)';
    case 'exponential':
      return 'hsl(200, 70%, 70%)';
  }
}

const updateValue = (value: Beat[]) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <div class="w-full">
    <div class="w-full flex justify-center bg-white z-10">
      <div class="border-4 border-slate-300 border-b-0">
        <button class="bg-red-100 w-36 px-4 p-2 text-bold border-2 border-red-600 text-red-600" :class="{ '!bg-red-300': transition == 'constant' }" @click="transition = 'constant'">Constant</button>
        <button class="bg-green-100 w-36 px-4 p-2 text-bold border-2 border-green-600 text-green-600" :class="{ '!bg-green-300': transition == 'linear' }" @click="transition = 'linear'">Linear</button>
        <button class="bg-blue-100 w-36 px-4 p-2 text-bold border-2 border-blue-600 text-blue-600" :class="{ '!bg-blue-300': transition == 'exponential' }" @click="transition = 'exponential'">Exponential</button>
      </div>
    </div>
    <div class="relative overflow-x-scroll overscroll-y-auto bg-white w-full border-4 border-slate-300">
      <div class="relative bg-repeat cursor-pointer" :style="{ height: values * 2 + 'rem', width: beats * 2 + 'rem' }" @click="toggleNote($event)" style="background-size: 2rem 2rem; background-image: linear-gradient(to top, transparent 0, transparent 0.9rem, rgba(0, 0, 0, 0.1) 0.9rem, rgba(0, 0, 0, 0.1) 1rem, transparent 1rem), linear-gradient(to right, transparent 0, transparent 0.9rem, rgba(0, 0, 0, 0.1) 0.9rem, rgba(0, 0, 0, 0.1) 1rem, transparent 1rem), radial-gradient(circle at center, transparent 0, transparent 0.4rem, rgba(0, 0, 0, 0.1) 0.4rem, rgba(0, 0, 0, 0.1) 0.5rem, transparent 0.5rem);">
        <svg :viewBox="viewBox" :width="beats * 32" :height="values * 32">
          <path :d="generatePath(modelValue)" fill="transparent" stroke-width="0.4" stroke="hsl(0, 70%, 80%)" />
          <transition-group name="fade">
            <circle v-for="value in modelValue" :key="JSON.stringify(value)" :cx="(Number(value.beat) - 0.5) * 2" :cy="(values - (value.index + 0.5)) * 2" r="0.6" fill="transparent" stroke-width="0.4" :stroke="generateStroke(value)" />
          </transition-group>
        </svg>
      </div>
    </div>
  </div>
</template>