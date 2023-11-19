<script setup lang="ts">
interface Props {
  hooked?: boolean
  text: string
}

withDefaults(defineProps<Props>(), {
  hooked: false,
});
</script>

<template>
  <div class="flex items-center gap-2">
    <span>{{ text }}</span>
    <button type="button" class="w-8 h-8 rounded-full hover:bg-gray-100 active:bg-gray-200 flex justify-center items-center dark:hover:bg-slate-500 dark:active:bg-slate-400">
      <svg viewBox="-15 -15 30 30" width="25" height="25">
        <circle cx="0" cy="0" r="12" fill="transparent" stroke="rgb(236 72 153)" stroke-width="4" :stroke-dasharray="hooked ? '0 9.7 56 9.7' : '0'" />
        <circle v-show="Boolean(hooked)" cx="0" cy="0" r="6" fill="rgb(236 72 153)" />
      </svg>
    </button>
  </div>
</template>
  