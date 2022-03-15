<template>
  <button type="button" class="h-12 w-12 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring focus:ring-blue-500 rounded-full bg-white shadow-lg flex justify-center items-center cursor-pointer">
    <plus-icon class="h-8 w-8 text-blue-500" />
  </button>
</template>

<script>
  import { PlusIcon } from '@heroicons/vue/solid';

  export default {
    components: {
      PlusIcon,
    },
  };
</script>
