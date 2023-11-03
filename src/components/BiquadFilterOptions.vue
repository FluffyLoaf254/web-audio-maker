<template>
  <div class="flex flex-col gap-4 p-4">
    <input-label value="Type">
      <select-input name="type" v-model="data.type">
        <option value="lowpass">Low-Pass</option>
        <option value="highpass">High-Pass</option>
        <option value="bandpass">Band-Pass</option>
        <option value="lowshelf">Low-Shelf</option>
        <option value="highshelf">High-Shelf</option>
        <option value="peaking">Peaking</option>
        <option value="notch">Notch</option>
        <option value="allpass">All-Pass</option>
      </select-input>
    </input-label>
    <audio-param :disabled="hasAudioParamInput('frequency')" v-model="data.frequency" title="Frequency" :default="440" :startDefault="262" algorithmDefault="x * 2 ^ (n / 12)" :beats="beats" min="0" max="20000" />
    <audio-param :disabled="hasAudioParamInput('detune')" v-model="data.detune" title="Detune" :default="0" :beats="beats" min="0" max="20000" algorithmDefault="x * 2 ^ (n / 12)" :startDefault="262" />
    <audio-param :disabled="hasAudioParamInput('Q')" v-model="data.Q" title="Q Factor" :beats="beats" min="0.0001" max="1000" :default="1" :defaultStart="0.0001" algorithmDefault="x + 2 ^ n" />
    <audio-param :disabled="hasAudioParamInput('gain')" v-model="data.gain" title="Gain" :beats="beats" min="-40" max="40" :default="0" :defaultStart="-40" algorithmDefault="x + 10 * n" :values="9" />
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
          audioParamInputs: [],
          data: {},
        },
        data: {
          type: 'lowpass',
          frequency: 350,
          detune: 0,
          Q: 1,
          gain: 0,
        },
        beats: 60,
      };
    },
    
    mounted() {
      this.node = this.$store.getters.getNode(this.id);
      if (this.node.data) {
        this.data.type = this.node.data.type ?? 'lowpass';
        this.data.frequency = this.node.data.frequency ?? 350;
        this.data.detune = this.node.data.detune ?? 0;
        this.data.Q = this.node.data.Q ?? 1;
        this.data.gain = this.node.data.gain ?? 0;
      }
      this.beats = this.$store.getters.inheritedBeats(this.node);
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
