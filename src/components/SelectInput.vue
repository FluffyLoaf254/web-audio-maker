<template>
  <select :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" class="rounded hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring focus:ring-blue-500 bg-white placeholder:text-gray-400 text-gray-600 py-2 px-3">
    <slot></slot>
  </select>
</template>

<script>
  export default {
    emits: ['update:modelValue'],

    props: {
      modelValue: {
        default: null,
      },
      type: {
        default: 'text',
      },
    },
  };
</script>
