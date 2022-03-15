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
      <div v-else class="relative overflow-scroll bg-white w-full h-64" ref="graph">
        <div class="min-w-full min-h-full grid" :style="{ 'grid-template-columns': 'repeat(' + beats + ', 1rem)', 'grid-template-rows': 'repeat(' + (values.length + 1) + ', 1rem)' }">
          <template v-for="value in reversedValues" :key="value">
            <div v-for="beat in Number(beats)" :key="beat">
              <input type="checkbox" :checked="hasValue(value, beat)" @input="$event.target.checked ? addValue(value, beat) : removeValue(value, beat)">
            </div>
          </template>
          <div v-for="beat in Number(beats)" :key="beat">
            <span v-if="beat > 1">X</span>
          </div>
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
      value(value) {
        this.$emit('update:modelValue', value);
      },
      simpleToggle(value) {
        if (this.simpleMounted && value) {
          this.$emit('update:modelValue', this.default);
        }
      },
    },

    computed: {
      reversedValues() {
        return [...this.values].reverse();
      },
    },

    methods: {
      addValue(value, beat) {
        let array = [];
        if (Array.isArray(this.modelValue)) {
          array = [...this.modelValue];
        }
        array.push({
          value,
          beat,
        });
        this.$emit('update:modelValue', array);
      },
      removeValue(value, beat) {
        let array = [...this.modelValue];
        array = array.filter(item => item.value != value || item.beat != beat);
        this.$emit('update:modelValue', array);
      },
      hasValue(value, beat) {
        if (!Array.isArray(this.modelValue)) {
          return false;
        }
        return this.modelValue.some(note => note.beat == beat && note.value == value);
      },
      updateValue(value) {
        this.$emit('update:modelValue', value);
      },
    },
  };
</script>
