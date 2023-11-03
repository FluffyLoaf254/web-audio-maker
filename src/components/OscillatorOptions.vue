<template>
  <div class="flex flex-col gap-4 p-4">
    <input-label value="Type">
      <select-input name="type" v-model="data.type">
        <option value="sine">Sine</option>
        <option value="square">Square</option>
        <option value="sawtooth">Sawtooth</option>
        <option value="triangle">Triangle</option>
      </select-input>
    </input-label>
    <audio-param :disabled="hasAudioParamInput('frequency')" v-model="data.frequency" title="Frequency" :default="440" :beats="node.beats" min="0" max="20000" :values="[262, 277, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494]" />
    <audio-param :disabled="hasAudioParamInput('detune')" v-model="data.detune" title="Detune" :default="0" :beats="node.beats" min="0" max="20000" :values="[262, 277, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494]" />
  </div>
</template>

<script>
  import InputLabel from './InputLabel.vue';
  import SelectInput from './SelectInput.vue';
  import AudioParam from './AudioParam.vue';

  export default {
    components: {
      InputLabel,
      SelectInput,
      AudioParam,
    },

    props: {
      id: {
        default: null,
      },
    },

    data() {
      return {
        node: {
          beats: 60,
          audioParamInputs: [],
          data: {},
        },
        data: {
          type: 'sine',
          frequency: 440,
          detune: 0,
        },
      };
    },
    
    mounted() {
      this.node = this.$store.getters.getNode(this.id);
      if (this.node.data) {
        this.data.type = this.node.data.type ?? 'sine';
        this.data.frequency = this.node.data.frequency ?? 440;
        this.data.detune = this.node.data.detune ?? 0;
      }
    },

    watch: {
      data: {
        handler(value) {
          this.$store.commit('updateNodeData', { id: this.id, data: value });
        },
        deep: true,
      },
    },

    methods: {
      hasAudioParamInput(param) {
        this.node.audioParamInputs.some(item => item.param == param);
      },
    },
  };
</script>
