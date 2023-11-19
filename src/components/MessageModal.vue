<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  show: boolean
  parent: HTMLElement
}

type Emits = {
  close: []
}

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

const convertPixelsToRem = (pixels: number): number => {
  return pixels / parseFloat(getComputedStyle(document.documentElement).fontSize);
};

const positionStyles = computed(() => {
  const bounds = props.parent.getBoundingClientRect();
  let styles = '';
  if (convertPixelsToRem(window.innerWidth) < 28) {
    styles += 'left: ' + (convertPixelsToRem(window.innerWidth / 2) - 7) + 'rem;';
  } else if (convertPixelsToRem(bounds.left) + 15 < convertPixelsToRem(window.innerWidth)) {
    styles += 'left: ' + (convertPixelsToRem(bounds.left) + 1) + 'rem;';
  } else {
    styles += 'right: ' + (convertPixelsToRem(window.innerWidth - bounds.right) + 1) + 'rem;';
  }
  if (convertPixelsToRem(bounds.bottom) + 15 < convertPixelsToRem(window.innerHeight)) {
    styles += 'top: ' + (convertPixelsToRem(bounds.bottom) + 1) + 'rem;';
  } else {
    styles += 'bottom: calc(100vh - ' + (convertPixelsToRem(bounds.top) - 1) + 'rem);';
  }
  
  return styles;
});

const close = () => {
  emit('close');
}
</script>

<template>
  <teleport to="body">
    <div v-if="show" class="absolute z-[300] fixed w-screen h-screen top-0 left-0" @click.stop="close" @touchstart.stop @mousedown.stop>
      <div class="absolute bg-white w-56 p-4 rounded shadow-lg" :style="positionStyles">
        <slot></slot>
      </div>
    </div>
  </teleport>
</template>
