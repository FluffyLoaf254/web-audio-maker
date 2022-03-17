<template>
  <div>
    <div class="flex flex-col gap-4" v-if="!disabled">
      <div class="flex gap-4 items-center">
        <h3>{{ title }}</h3>
        <input-label value="Static" :for="'static-toggle-' + title" />
        <toggle-input :id="'static-toggle-' + title" v-model:checked="simpleToggle" />
      </div>
      <div v-if="simpleToggle">
        <input-label value="Value">
          <form-input type="number" :min="min" :max="max" :modelValue="modelValue" @update:modelValue="updateValue" />
        </input-label>
      </div>
      <div v-else class="relative overflow-scroll bg-white w-full" ref="graph">
        <div class="relative bg-repeat cursor-pointer" :style="{ height: values.length + 'rem', width: beats + 'rem' }" @click="toggleNote($event)" style="background-size: 1rem 1rem; background-image: radial-gradient(circle at center, transparent 0, transparent 0.3rem, rgba(0, 0, 0, 0.2) 0.3rem, rgba(0, 0, 0, 0.2) 0.4rem, transparent 0.4rem);">
          <svg :viewBox="viewBox" :width="beats * 16" :height="values.length * 16">
            <transition-group name="fade">
              <circle v-for="value in arrayValue" :key="JSON.stringify(value)" :cx="(Number(value.beat) - 0.5)" :cy="(this.values.length - (this.values.indexOf(value.value) + 0.5))" r="0.25" fill="transparent" stroke-width="0.2" stroke="hsl(0, 70%, 70%)" />
            </transition-group>
          </svg>
        </div>
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
      simple: {
        default: true,
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
      max: {
        default: 1,
      },
      values: {
        default: [],
      },
      beats: {
        default: 60,
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
        simpleToggle: true,
        simpleMounted: false,
      };
    },

    mounted() {
      this.simpleToggle = this.simple;
      this.simpleMounted = true;
    },

    watch: {
      simpleToggle(value) {
        if (this.simpleMounted && value) {
          this.$emit('update:modelValue', this.default);
        }
      },
    },

    computed: {
      viewBox() {
        return '0 0 ' + this.beats + ' ' + this.values.length;
      },
      arrayValue() {
        return Array.isArray(this.modelValue) ? this.modelValue : [];
      }
    },

    methods: {
      convertPixelsToRem(pixels) {
        return pixels / parseFloat(getComputedStyle(document.documentElement).fontSize);
      },
      toggleNote(event) {
        const beat = Math.round(this.convertPixelsToRem(event.offsetX) + 0.5);
        const value = this.values[Math.round(this.values.length - (this.convertPixelsToRem(event.offsetY) + 0.5))];
        if (!this.hasValue({ value, beat })) {
          if (this.hasValue({ beat })) {
            this.removeValue({ beat });
          }
          this.$nextTick(() => this.addValue({ value, beat }));
        } else {
          this.removeValue({ value, beat });
        }
      },
      addValue(value) {
        let array = [];
        if (Array.isArray(this.modelValue)) {
          array = [...this.modelValue];
        }
        array.push(value);
        this.$emit('update:modelValue', array);
      },
      removeValue(value) {
        let array = [...this.modelValue];
        array = array.filter(note => {
          for (let property in value) {
            if (note[property] == value[property]) {
              return false;
            }
          }

          return true;
        });
        this.$emit('update:modelValue', array);
      },
      hasValue(value) {
        if (!Array.isArray(this.modelValue)) {
          return false;
        }
        return this.modelValue.some(note => {
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
    },
  };
</script>
