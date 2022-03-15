<template>
  <div class="absolute pointer-events-none" :style="{ width: '500rem', height: '500rem' }" style="transition: top 0.05s linear, left 0.05s linear;">
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
        tweenedStart: {
          x: 0,
          y: 0,
        },
        tweenedEnd: {
          x: 0,
          y: 0,
        },
        startHandler: null,
        endHandler: null,
      };
    },

    watch: {
      start(value) {
        if (this.startHandler) {
          clearInterval(this.startHandler);
        }
        this.tweenedStart.x = (this.tweenedStart.x == 0 ? value.x : this.lerp(this.tweenedStart.x, value.x, 0.31));
        this.tweenedStart.y = (this.tweenedStart.y == 0 ? value.y : this.lerp(this.tweenedStart.y, value.y, 0.31));
        this.startHandler = setInterval(() => {
          this.tweenedStart.x = (this.tweenedStart.x == 0 ? value.x : this.lerp(this.tweenedStart.x, value.x, 0.31));
          this.tweenedStart.y = (this.tweenedStart.y == 0 ? value.y : this.lerp(this.tweenedStart.y, value.y, 0.31));
        }, 50);
      },
      end(value) {
        if (this.endHandler) {
          clearInterval(this.endHandler);
        }
        this.tweenedEnd.x = (this.tweenedEnd.x == 0 ? value.x : this.lerp(this.tweenedEnd.x, value.x, 0.31));
        this.tweenedEnd.y = (this.tweenedEnd.y == 0 ? value.y : this.lerp(this.tweenedEnd.y, value.y, 0.31));
        this.endHandler = setInterval(() => {
          this.tweenedEnd.x = (this.tweenedEnd.x == 0 ? value.x : this.lerp(this.tweenedEnd.x, value.x, 0.31));
          this.tweenedEnd.y = (this.tweenedEnd.y == 0 ? value.y : this.lerp(this.tweenedEnd.y, value.y, 0.31));
        }, 50);
      },
    },

    computed: {
      path() {
        return 'M' + this.tweenedStart.x + ',' + this.tweenedStart.y +
          ' C' + (this.tweenedStart.x + Math.min(10, Math.abs(this.tweenedStart.x - this.tweenedEnd.x))) + 
          ',' + this.tweenedStart.y + ' ' + (this.tweenedEnd.x - Math.min(10, Math.abs(this.tweenedStart.x - this.tweenedEnd.x))) + 
          ',' + this.tweenedEnd.y + ' ' + this.tweenedEnd.x + ',' + this.tweenedEnd.y;
      },
    },

    methods: {
      lerp(start, end, alpha) {
        return start * (1 - alpha) + end * alpha;
      },
    },
  };
</script>
