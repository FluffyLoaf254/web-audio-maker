<script setup lang="ts">
interface Props {
  modelValue?: string
  name?: string
  id?: string
}

type Emits = {
  'update:modelValue': [value: string]
}

defineProps<Props>();

defineEmits<Emits>();
</script>

<template>
  <select :value="modelValue" :name="name" :id="id" @input="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)" class="rounded hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring focus:ring-blue-500 bg-white placeholder:text-gray-400 text-gray-600 py-2 px-3 dark:bg-slate-500 dark:text-gray-200 dark:placeholder:text-gray-300 dark:hover:bg-slate-500 dark:active:bg-slate-400">
    <slot></slot>
  </select>
</template>
