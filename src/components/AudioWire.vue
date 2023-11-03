<template>
  <div class="absolute pointer-events-none" :style="{ 'z-index': 100, width: '500rem', height: '500rem' }">
    <svg viewBox="0 0 500 500" width="100%" height="100%">
      <path :d="path" :stroke="color" stroke-width="0.25" fill="transparent" />
    </svg>
  </div>
</template>

<script>
  export default {
    props: {
      start: {
        default: {
          x: 0,
          y: 0,
        },
      },
      end: {
        default: {
          x: 0,
          y: 0,
        },
      },
      color: {
        default: 'black',
      },
    },

    data() {
      return {
        startHandler: null,
        endHandler: null,
      };
    },

    computed: {
      path() {
        return 'M' + this.start.x + ',' + this.start.y +
          ' C' + (this.start.x + Math.min(10, Math.abs(this.start.x - this.end.x))) + 
          ',' + this.start.y + ' ' + (this.end.x - Math.min(10, Math.abs(this.start.x - this.end.x))) + 
          ',' + this.end.y + ' ' + this.end.x + ',' + this.end.y;
      },
    },

    methods: {
      lerp(start, end, alpha) {
        return start * (1 - alpha) + end * alpha;
      },
    },
  };
</script>
