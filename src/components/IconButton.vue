<script setup lang="ts">
interface Props {
  label: string
}

defineProps<Props>();
</script>

<template>
  <button type="button" class="disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 h-8 w-8 text-gray-500 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring focus:ring-blue-500 rounded-full flex justify-center items-center cursor-pointer" :aria-label="label">
    <slot></slot>
  </button>
</template>
