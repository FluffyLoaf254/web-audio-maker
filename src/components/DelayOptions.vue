<template>
  <div class="flex flex-col gap-4 p-4">
    <audio-param :disabled="hasAudioParamInput('delayTime')" v-model="data.delayTime" title="Delay" :beats="beats" min="0" max="1" :default="1" :values="[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]" />
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
          delayTime: 0,
        },
        beats: 60,
      };
    },
    
    mounted() {
      this.node = this.$store.getters.getNode(this.id);
      if (this.node.data) {
        this.data.delayTime = this.node.data.delayTime ?? 0;
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
