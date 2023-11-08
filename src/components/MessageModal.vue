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

const positionStyles = computed(() => {
  const bounds = props.parent.getBoundingClientRect();
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
});

const close = () => {
  emit('close');
}
</script>

<template>
  <teleport to="body">
    <div v-if="show" class="z-[400] fixed w-screen h-screen top-0 left-0" @click.stop="close" @touchstart.stop @mousedown.stop>
      <div class="absolute bg-white w-52 p-4 rounded shadow-xl" :style="positionStyles">
        <slot></slot>
      </div>
    </div>
  </teleport>
</template>
