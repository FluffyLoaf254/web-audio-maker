<template>
  <button type="button" class="w-8 h-8 rounded-full hover:bg-gray-100 active:bg-gray-200 flex justify-center items-center">
    <svg viewBox="-15 -15 30 30" width="25" height="25">
      <polygon points="-9,-12 11.785,0 -9,12" fill="transparent" stroke="#3B82F6" stroke-width="4" :stroke-dasharray="hooked ? '53 14 10' : '0'" />
      <polygon v-show="Boolean(hooked)" points="-5,-5 6,0 -5,5" fill="#3B82F6" />
    </svg>
  </button>
</template>

<script>
  export default {
    props: {
      hooked: {
        default: false,
      },
    },
  };
</script>
