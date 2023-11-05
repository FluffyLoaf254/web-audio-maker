<script setup lang="ts">
interface Props {
  modelValue?: number | string
  type?: 'number' | 'text'
  id?: string
  name?: string
}

type Emits = {
  'update:modelValue': [type: number | string]
}

withDefaults(defineProps<Props>(), {
  type: 'text',
});

defineEmits<Emits>();
</script>

<template>
  <input :type="type" :name="name" :id="id" :value="modelValue" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" class="rounded hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring focus:ring-blue-500 bg-white placeholder:text-gray-400 text-gray-600 py-1 px-2">
</template>
