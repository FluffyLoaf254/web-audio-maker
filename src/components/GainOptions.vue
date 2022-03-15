<template>
  <div class="flex flex-col gap-4 p-4">
    <audio-param :disabled="Boolean(node.audioParams.gain)" v-model="data.gain" title="Gain" :beats="node.beats" min="0" max="10" :default="1" :values="[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 2.0, 3.0, 4.0, 5.0]" />
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
          audioParams: {},
          data: {},
          beats: 60,
        },
        data: {
          gain: 1,
        },
      };
    },
    
    mounted() {
      this.node = this.$store.getters.getNode(this.id);
      if (this.node.data) {
        this.data.gain = this.node.data.gain ?? 1;
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
  };
</script>
