<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import MessageModal from './MessageModal.vue';

const elements = ref<HTMLElement[]|null>(null);
const index = ref(0);
const showing = ref(false);
const bounds = ref<DOMRect|null>(null);

const current = computed(() => elements.value ? elements.value[index.value] : null);
const boundsStyles = computed(() => {
  return bounds.value ? 'left: ' + bounds.value.left + 'px; top: ' + bounds.value.top + 'px; width: ' + (bounds.value.right - bounds.value.left) + 'px; height: ' + (bounds.value.bottom - bounds.value.top) + 'px;' : '';
})

const begin = () => {
  index.value = 0;
  elements.value = Array.from(window.document.querySelectorAll('[data-tutorial]'));
  elements.value = elements.value.filter(element => element.dataset.tutorial && element.dataset.tutorial.length > 0);
  showing.value = true;
  if (current.value) {
    current.value.classList.add('tutorial-element-shadow');
  }
};

const end = () => {
  showing.value = false;
};

const next = () => {
  if (!current.value) {
    return;
  }
  current.value.classList.remove('tutorial-element-shadow');
  if (index.value >= (elements.value?.length ?? 0) - 1) {
    end();
    return;
  } else {
    index.value++;
  }
  current.value.classList.add('tutorial-element-shadow');
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
  <div v-if="showing" class="z-[200] fixed w-screen h-screen">
    <div class="absolute tutorial-shadow" :style="boundsStyles"></div>
    <message-modal :show="showing" :parent="current" @close="next">{{ current?.dataset.tutorial }}</message-modal>
  </div>
</template>

<style>
.tutorial-shadow {
  box-shadow: 0 0 1rem 1rem white, 0 0 0 1000rem rgba(0, 0, 0, 0.3);
}

.dark .tutorial-shadow {
  box-shadow: 0 0 1rem 1rem rgb(51 65 85), 0 0 0 1000rem rgba(0, 0, 0, 0.3);
}

.tutorial-element-shadow {
  box-shadow: 0 0 0 0.7rem white;
}

.dark .tutorial-element-shadow {
  box-shadow: 0 0 0 0.7rem rgb(51 65 85);
}
</style>
