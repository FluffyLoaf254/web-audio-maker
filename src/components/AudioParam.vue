<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import InputLabel from './InputLabel.vue';
import ToggleInput from './ToggleInput.vue';
import FormInput from './FormInput.vue';
import AudioParamGraph from './AudioParamGraph.vue';
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

const trimValues = () => {
  let object = newObject([]);
  let item = props.modelValue;
  if (isComplexDataItem(item)) {
    object.array = [...item.array].filter(value => value.index < values.value);
  }

  updateValue(object);
}

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
        <audio-param-graph :model-value="modelValue.array" @update:model-value="(beats) => updateValue(newObject(beats))" :start="start" :values="values" :algorithm="algorithm" :beats="beats" />
        <div class="flex gap-4">
          <input-label value="Start">
            <form-input :name="'dynamic-start-' + title" type="number" :min="min" v-model="start" @change="recalculateValues" />
          </input-label>
          <input-label value="Number">
            <form-input :name="'dynamic-number-' + title" type="number" min="1" max="24" step="1" pattern="^[0-9]+$" v-model="values" @change="trimValues" />
          </input-label>
        </div>
        <input-label value="Algorithm">
          <form-input :name="'dynamic-algorithm-' + title" class="w-full" type="text" pattern="^[xn\-\+\/\*\^0-9\.\(\)\s]*$" v-model="algorithm" @change="recalculateValues" />
        </input-label>
      </div>
      <div v-else>
        <input-label value="Value">
          <form-input :name="'static-' + title" class="w-full" type="number" :min="start" :max="generateValue(values)" :model-value="modelValue" @update:model-value="updateValue" />
        </input-label>
      </div>
    </div>
    <div class="flex flex-col gap-4" v-else>
      <h3>{{ title }}</h3>
      <p class="text-gray-500 text-sm italic">This parameter is being driven by another node.</p>
    </div>
  </div>
</template>
