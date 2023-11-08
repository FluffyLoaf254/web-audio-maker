<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import InputLabel from './InputLabel.vue';
import ToggleInput from './ToggleInput.vue';
import FormInput from './FormInput.vue';
import { evaluate } from 'mathjs';
import { isSimpleDataItem, isComplexDataItem, type SimpleDataItem, type DataItem, type Beat } from '../types';

interface Props {
  default?: SimpleDataItem
  modelValue: DataItem
  title: string
  disabled?: boolean
  min?: number
  beats?: number | null
  startDefault?: number
  algorithmDefault?: string
  valuesDefault?: number
}

type Emits = {
  'update:modelValue': [value: DataItem]
};

const props = withDefaults(defineProps<Props>(), {
  default: 0,
  disabled: false,
  min: 0,
  beats: 60,
  startDefault: 0,
  algorithmDefault: 'x + n',
  valuesDefault:  12,
});

const emit = defineEmits<Emits>();

const start = ref(0)
const algorithm = ref('x + n')
const values = ref(12)

const viewBox = computed(() => {
  return '0 0 ' + props.beats * 2 + ' ' + values.value * 2;
});

onMounted(() => {
  setToDefaults();
});

watch(start, () => {
  updateProperties();
});
watch(algorithm, () => {
  updateProperties();
});
watch(values, () => {
  updateProperties();
});

const recalculateValues = () => {
  let object = newObject([]);
  let item = props.modelValue;
  if (isComplexDataItem(item)) {
    object.array = [...item.array].map(value => {
      value.value = generateValue(value.index);

      return value;
    });
  }

  updateValue(object);
};

const convertPixelsToRem = (pixels: number): number => {
  return pixels / parseFloat(getComputedStyle(document.documentElement).fontSize);
};

const toggleNote = (event) => {
  const beat = Math.round(convertPixelsToRem(event.offsetX / 2) + 0.5);
  const index = Math.round(values.value - (convertPixelsToRem(event.offsetY / 2) + 0.5));
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

const addValue = (value) => {
  let object = newObject([]);
  let item = props.modelValue;
  if (isComplexDataItem(item)) {
    object.array = [...item.array];
  }
  object.array.push(value);
  updateValue(object);
};

const removeValue = (value) => {
  let item = props.modelValue;
  if (!isComplexDataItem(item)) {
    return false;
  }
  let object = newObject([...item.array]);
  object.array = object.array.filter(note => {
    for (let property in value) {
      if (note[property] != value[property]) {
        return true;
      }
    }

    return false;
  });
  updateValue(object);
};

const hasValue = (value) => {
  let item = props.modelValue;
  if (!isComplexDataItem(item)) {
    return false;
  }
  return item.array.some(note => {
    for (let property in value) {
      if (note[property] != value[property]) {
        return false;
      }
    }

    return true;
  });
};

const updateValue = (value) => {
  emit('update:modelValue', value);
};

const resetValue = (checked: boolean) => {
  setToDefaults();
  updateValue(checked ? props.default : newObject([]));
};

const setToDefaults = () => {
  let item = props.modelValue;
  if (isComplexDataItem(item)) {
    start.value = item.start;
    algorithm.value = item.algorithm;
    values.value = item.values;
  } else {
    start.value = props.startDefault;
    algorithm.value = props.algorithmDefault;
    values.value = props.valuesDefault;
  }
};

const generateValue = (index: number) => {
  try {
    return evaluate(algorithm.value, { x: start.value, n: index - 1 });
  } catch (error) {
    return 0;
  }
};

const updateProperties = () => {
  nextTick(() => {
    let item = props.modelValue;
    if (isComplexDataItem(item)) {
      updateValue(newObject([...item.array]))
    }
  });
};

const newObject = (array: Beat[]) => {
  return {
    start: start.value,
    algorithm: algorithm.value,
    values: values.value,
    array: array,
  };
};
</script>

<template>
  <div>
    <div class="flex flex-col gap-4" v-if="!disabled">
      <div class="flex gap-4 items-center">
        <h3>{{ title }}</h3>
        <input-label value="Static" :for="'static-toggle-' + title" />
        <toggle-input :name="'static-toggle-' + title" :id="'static-toggle-' + title" :checked="isSimpleDataItem(modelValue)" @update:checked="resetValue" />
      </div>
      <div v-if="isComplexDataItem(modelValue)" class="flex flex-col gap-4">
        <div class="relative overflow-x-scroll overscroll-y-auto bg-white w-full" ref="graph">
          <div class="relative bg-repeat cursor-pointer" :style="{ height: values * 2 + 'rem', width: beats * 2 + 'rem' }" @click="toggleNote($event)" style="background-size: 2rem 2rem; background-image: radial-gradient(circle at center, transparent 0, transparent 0.6rem, rgba(0, 0, 0, 0.2) 0.6rem, rgba(0, 0, 0, 0.2) 0.8rem, transparent 0.8rem);">
            <svg :viewBox="viewBox" :width="beats * 32" :height="values * 32">
              <transition-group name="fade">
                <circle v-for="value in modelValue.array" :key="JSON.stringify(value)" :cx="(Number(value.beat) - 0.5) * 2" :cy="(values - (value.index + 0.5)) * 2" r="0.5" fill="transparent" stroke-width="0.4" stroke="hsl(0, 70%, 70%)" />
              </transition-group>
            </svg>
          </div>
        </div>
        <div class="flex gap-4">
          <input-label value="Start">
            <form-input :name="'dynamic-start-' + title" type="number" :min="min" v-model="start" />
          </input-label>
          <input-label value="Number">
            <form-input :name="'dynamic-number-' + title" type="number" min="1" max="24" step="1" pattern="^[0-9]+$" v-model="values" />
          </input-label>
        </div>
        <input-label value="Algorithm">
          <form-input :name="'dynamic-algorithm-' + title" class="w-full" type="text" pattern="^[xn\-\+\/\*\^0-9\.\(\)\s]*$" v-model="algorithm" @change="recalculateValues()" />
        </input-label>
      </div>
      <div v-else>
        <input-label value="Value">
          <form-input :name="'static-' + title" class="w-full" type="number" :min="start" :max="generateValue(values)" :modelValue="modelValue" @update:modelValue="updateValue" />
        </input-label>
      </div>
    </div>
    <div class="flex flex-col gap-4" v-else>
      <h3>{{ title }}</h3>
      <p class="text-gray-500 text-sm italic">This parameter is being driven by another node.</p>
    </div>
  </div>
</template>
