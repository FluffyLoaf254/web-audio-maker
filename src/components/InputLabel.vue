<script setup lang="ts">
interface Props {
  value: string
}

defineProps<Props>();
</script>

<template>
  <label class="flex flex-col gap-2">
    <span class="text-gray-500 font-light uppercase text-sm">{{ value }}</span>
    <slot></slot>
  </label>
</template>
