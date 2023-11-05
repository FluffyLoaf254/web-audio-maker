<script setup lang="ts">
interface Props {
  checked?: boolean
  id?: string
  name?: string
}

type Emits = {
  'update:checked': [checked: boolean]
}

withDefaults(defineProps<Props>(), {
  checked: false,
});

defineEmits<Emits>();
</script>

<template>
  <label>
    <div class="relative rounded-full shadow-inner transition-all disabled:brightness-75 w-12 h-6" :class="{ 'bg-green-300': checked, 'bg-gray-200': !checked }">
      <div class="absolute w-6 h-6 rounded-full bg-white shadow-md top-0 transition-all" :class="{ 'left-6': !checked, 'left-0': checked }"></div>
    </div>
    <input type="checkbox" class="hidden" :id="id" :name="name" :checked="checked" @input="$emit('update:checked', ($event.target as HTMLInputElement).checked)" />
  </label>
</template>
