<template>
    <div class="flex flex-col gap-4 p-4">
      <audio-param v-model="data.output" title="Data" :beats="node.beats" min="0" max="20000" />
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
            data: {},
          },
          data: {
            output: 0,
          },
        };
      },
      
      mounted() {
        this.node = this.$store.getters.getNode(this.id);
        if (this.node.data) {
          this.data.output = this.node.data.output ?? 0;
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
  