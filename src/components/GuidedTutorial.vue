<template>
<div v-if="showing" class="z-[300] fixed w-screen h-screen" @click.stop="next" @touchstart.stop @mousedown.stop>
  <div class="absolute" style="box-shadow: 0 0 1rem 1rem white, 0 0 0 1000rem rgba(0, 0, 0, 0.3)" :style="bounds"></div>
  <div v-if="showing" class="absolute bg-white w-52 p-4 rounded shadow-lg" :style="position">
    {{ current.dataset.tutorial }}
  </div>
</div>
</template>

<script>
  export default {
    data() {
      return {
        elements: [],
        index: 0,
        showing: false,
      };
    },

    computed: {
      current() {
        return this.elements[this.index];
      },
      bounds() {
        const bounds = this.current.getBoundingClientRect();

        return 'left: ' + bounds.left + 'px; top: ' + bounds.top + 'px; width: ' + (bounds.right - bounds.left) + 'px; height: ' + (bounds.bottom - bounds.top) + 'px;';
      },
      position() {
        const bounds = this.current.getBoundingClientRect();
        let styles = '';
        if (window.innerWidth < 24 * 16) {
          styles += 'left: ' + ((window.innerWidth / 2) - 6 * 16) + 'px;';
        } else if (bounds.left < window.innerWidth / 2) {
          styles += 'left: ' + (bounds.left + 2 * 16) + 'px;';
        } else {
          styles += 'right: ' + (window.innerWidth - bounds.right + 2 * 16) + 'px;';
        }
        if (bounds.bottom + 14 * 16 < window.innerHeight) {
          styles += 'top: ' + (bounds.bottom + 2 * 16) + 'px;';
        } else {
          styles += 'bottom: calc(100vh - ' + (bounds.top - 2 * 16) + 'px);';
        }
        
        return styles;
      },
    },

    methods: {
      begin() {
        this.index = 0;
        this.elements = window.document.querySelectorAll('[data-tutorial]');
        this.showing = true;
        this.current.style.boxShadow = '0 0 0 0.7rem white';
      },
      next() {
        this.current.style.boxShadow = null;
        if (this.index >= this.elements.length - 1) {
          this.end();
          return;
        } else {
          this.index++;
        }
        this.current.style.boxShadow = '0 0 0 0.7rem white';
      },
      end() {
        this.showing = false;
      },
    },
  };
</script>
