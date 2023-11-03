<template>
<div v-if="showing" class="z-[300] fixed w-screen h-screen">
  <div class="absolute" style="box-shadow: 0 0 1rem 1rem white, 0 0 0 1000rem rgba(0, 0, 0, 0.3)" :style="boundsStyles"></div>
  <message-modal :show="showing" :parent="current" @close="next">{{ current.dataset.tutorial }}</message-modal>
</div>
</template>

<script>
  import MessageModal from './MessageModal.vue';

  export default {
    components: {
      MessageModal,
    },

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
      boundsStyles() {
        const bounds = this.current.getBoundingClientRect();

        return 'left: ' + bounds.left + 'px; top: ' + bounds.top + 'px; width: ' + (bounds.right - bounds.left) + 'px; height: ' + (bounds.bottom - bounds.top) + 'px;';
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
