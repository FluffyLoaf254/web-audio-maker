<template>
  <div class="flex items-center gap-2">
    <button type="button" class="w-8 h-8 rounded-full hover:bg-gray-100 active:bg-gray-200 flex justify-center items-center">
      <svg viewBox="-15 -15 30 30" width="25" height="25">
        <circle cx="0" cy="0" r="12" fill="transparent" stroke="rgb(236 72 153)" stroke-width="4" :stroke-dasharray="hooked ? '28 19.4 28' : '0'" />
        <circle v-show="Boolean(hooked)" cx="0" cy="0" r="6" fill="rgb(168 85 247)" />
      </svg>
    </button>
    <span>{{ text }}</span>
  </div>
</template>

<script>
  export default {
    props: {
      hooked: {
        default: false,
      },
      text: {
        default: 'Unspecified',
      },
    },
  };
</script>
