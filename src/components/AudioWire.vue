<script setup lang="ts">
import { computed } from 'vue';

interface Point {
  x: number
  y: number
}

interface Props {
  start: Point
  end: Point
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'black',
});

const path = computed(() => {
  return 'M' + props.start.x + ',' + props.start.y +
    ' C' + (props.start.x + Math.min(10, Math.abs(props.start.x - props.end.x))) + 
    ',' + props.start.y + ' ' + (props.end.x - Math.min(10, Math.abs(props.start.x - props.end.x))) + 
    ',' + props.end.y + ' ' + props.end.x + ',' + props.end.y;
});
</script>

<template>
  <div class="absolute pointer-events-none" :style="{ 'z-index': 100, width: '500rem', height: '500rem' }">
    <svg viewBox="0 0 500 500" width="100%" height="100%">
      <path :d="path" :stroke="color" stroke-width="0.25" fill="transparent" />
    </svg>
  </div>
</template>
