<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import MessageModal from './MessageModal.vue';

const elements = ref<NodeListOf<HTMLElement>|null>(null);
const index = ref(0);
const showing = ref(false);
const bounds = ref<DOMRect|null>(null);

const current = computed(() => elements.value ? elements.value[index.value] : null);
const boundsStyles = computed(() => {
  return bounds.value ? 'left: ' + bounds.value.left + 'px; top: ' + bounds.value.top + 'px; width: ' + (bounds.value.right - bounds.value.left) + 'px; height: ' + (bounds.value.bottom - bounds.value.top) + 'px;' : '';
})

const begin = () => {
  index.value = 0;
  elements.value = window.document.querySelectorAll('[data-tutorial]');
  showing.value = true;
  current.value.style.boxShadow = '0 0 0 0.7rem white';
};

const end = () => {
  showing.value = false;
};

const next = () => {
  current.value.style.boxShadow = null;
  if (index.value >= elements.value.length - 1) {
    end();
    return;
  } else {
    index.value++;
  }
  current.value.style.boxShadow = '0 0 0 0.7rem white';
};

defineExpose({
  begin,
});

const resize = () => {
  bounds.value = current.value ? current.value.getBoundingClientRect() : null;
}

watch(current, resize);

onMounted(() => {
  window.addEventListener('resize', resize);
});

onUnmounted(() => {
  window.removeEventListener('resize', resize);
});
</script>

<template>
  <div v-if="showing" class="z-[300] fixed w-screen h-screen">
    <div class="absolute" style="box-shadow: 0 0 1rem 1rem white, 0 0 0 1000rem rgba(0, 0, 0, 0.3)" :style="boundsStyles"></div>
    <message-modal :show="showing" :parent="current" @close="next">{{ current.dataset.tutorial }}</message-modal>
  </div>
</template>
