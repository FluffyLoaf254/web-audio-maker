<template>
  <button type="button" class="w-8 h-8 rounded-full hover:bg-gray-100 active:bg-gray-200 flex justify-center items-center">
    <svg viewBox="-15 -15 30 30" width="25" height="25">
      <rect x="-12" y="-12" width="24" height="24" fill="transparent" stroke="rgb(168 85 247)" stroke-width="4" :stroke-dasharray="hooked ? '29 14 53' : '0'" />
      <rect v-show="Boolean(hooked)" x="-6" y="-6" width="12" height="12" fill="rgb(168 85 247)" />
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
