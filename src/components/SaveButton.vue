<script setup lang="ts">
import { DocumentArrowDownIcon } from '@heroicons/vue/24/solid';
</script>

<template>
  <button type="button" class="z-[150] h-12 w-12 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring focus:ring-blue-500 rounded-md bg-white shadow-lg flex justify-center items-center cursor-pointer" aria-label="Save to JSON">
    <document-arrow-down-icon class="h-8 w-8 text-blue-500" />
  </button>
</template>
