<template>
  <div class="flex flex-col gap-4 p-4">
    <audio-param :disabled="hasAudioParamInput('gain')" v-model="data.gain" title="Gain" :beats="beats" min="0" max="10" :default="1" :defaultStart="0.0" algorithmDefault="x + 2 ^ (n / 2)" />
  </div>
</template>

<script>
  import AudioParam from './AudioParam.vue';

  export default {
    components: {
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
          gain: 1,
        },
        beats: 60,
      };
    },
    
    mounted() {
      this.node = this.$store.getters.getNode(this.id);
      if (this.node.data) {
        this.data.gain = this.node.data.gain ?? 1;
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
