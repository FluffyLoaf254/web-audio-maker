<template>
  <div>
    <div class="flex flex-col gap-4" v-if="!disabled">
      <div class="flex gap-4 items-center">
        <h3>{{ title }}</h3>
        <input-label value="Static" :for="'static-toggle-' + title" />
        <toggle-input :name="'static-toggle-' + title" :id="'static-toggle-' + title" :checked="!modelValue.array || !Array.isArray(modelValue.array)" @update:checked="resetValue" />
      </div>
      <div v-if="!modelValue.array || !Array.isArray(modelValue.array)">
        <input-label value="Value">
          <form-input :name="'static-' + title" class="w-full" type="number" :min="start" :max="generateValue(values)" :modelValue="modelValue" @update:modelValue="updateValue" />
        </input-label>
      </div>
      <div v-else class="flex flex-col gap-4">
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
    </div>
    <div class="flex flex-col gap-4" v-else>
      <h3>{{ title }}</h3>
      <p class="text-gray-500 text-sm italic">This parameter is being driven by another node.</p>
    </div>
  </div>
</template>

<script>
  import InputLabel from './InputLabel.vue';
  import ToggleInput from './ToggleInput.vue';
  import FormInput from './FormInput.vue';
  import { evaluate } from 'mathjs';

  export default {
    components: {
      InputLabel,
      ToggleInput,
      FormInput,
    },

    props: {
      default: {
        default: 0,
      },
      modelValue: {
        default: null,
      },
      title: {
        default: 'Unspecified',
      },
      disabled: {
        default: false,
      },
      min: {
        default: 0,
      },
      beats: {
        default: 60,
      },
      startDefault: {
        default: 0,
      },
      algorithmDefault: {
        default: 'x + n',
      },
      valuesDefault: {
        default: 12,
      },
    },

    emits: ['update:modelValue'],

    data() {
      return {
        transitions: [
          'none',
          'linear',
          'exponential',
          'decay',
          'smooth',
        ],
        start: 0,
        algorithm: 'x + n',
        values: 12,
      };
    },

    computed: {
      viewBox() {
        return '0 0 ' + this.beats * 2 + ' ' + this.values * 2;
      },
    },

    mounted() {
      this.setToDefaults();
    },

    watch: {
      start(value) {
        this.updateProperties();
      },
      algorithm(value) {
        this.updateProperties();
      },
      values(value) {
        this.updateProperties();
      },
    },

    methods: {
      recalculateValues() {
        let object = this.newObject([]);
        if (Boolean(this.modelValue.array) && Array.isArray(this.modelValue.array)) {
          object.array = [...this.modelValue.array].map(value => {
            value.value = this.generateValue(value.index);

            return value;
          });
        }

        this.$emit('update:modelValue', object);
      },
      convertPixelsToRem(pixels) {
        return pixels / parseFloat(getComputedStyle(document.documentElement).fontSize);
      },
      toggleNote(event) {
        const beat = Math.round(this.convertPixelsToRem(event.offsetX / 2) + 0.5);
        const index = Math.round(this.values - (this.convertPixelsToRem(event.offsetY / 2) + 0.5));
        const value = this.generateValue(index);
        if (!this.hasValue({ index, beat })) {
          if (this.hasValue({ beat })) {
            this.removeValue({ beat });
          }
          this.$nextTick(() => this.addValue({ value, index, beat }));
        } else {
          this.removeValue({ beat });
        }
      },
      addValue(value) {
        let object = this.newObject([]);
        if (this.modelValue.array && Array.isArray(this.modelValue.array)) {
          object.array = [...this.modelValue.array];
        }
        object.array.push(value);
        this.$emit('update:modelValue', object);
      },
      removeValue(value) {
        let object = this.newObject([...this.modelValue.array]);
        object.array = object.array.filter(note => {
          for (let property in value) {
            if (note[property] != value[property]) {
              return true;
            }
          }

          return false;
        });
        this.$emit('update:modelValue', object);
      },
      hasValue(value) {
        if (!this.modelValue.array || !Array.isArray(this.modelValue.array)) {
          return false;
        }
        return this.modelValue.array.some(note => {
          for (let property in value) {
            if (note[property] != value[property]) {
              return false;
            }
          }

          return true;
        });
      },
      updateValue(value) {
        this.$emit('update:modelValue', value);
      },
      resetValue(checked) {
        this.setToDefaults();
        this.$emit('update:modelValue', checked ? this.default : this.newObject([]));
      },
      setToDefaults() {
        this.start = this.modelValue.start ?? this.startDefault;
        this.algorithm = this.modelValue.algorithm ?? this.algorithmDefault;
        this.values = this.modelValue.values ?? this.valuesDefault;
      },
      generateValue(index) {
        try {
          return evaluate(this.algorithm, { x: this.start, n: index - 1 });
        } catch (error) {
          return 0;
        }
      },
      updateProperties() {
        if (this.modelValue.array && Array.isArray(this.modelValue.array)) {
          this.$nextTick(() => this.$emit('update:modelValue', this.newObject([...this.modelValue.array])));
        }
      },
      newObject(array) {
        return {
          start: this.start,
          algorithm: this.algorithm,
          values: this.values,
          array: array,
        };
      }
    },
  };
</script>
