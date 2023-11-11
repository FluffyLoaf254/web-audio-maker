import { watch, onBeforeMount, type Ref } from 'vue';
import { useStore } from '../store';
import { type Node } from '../types';

export function useNodeMeta(id: string, node: Ref<Node | null>, meta: Ref<any>) {
  const store = useStore();
  
  onBeforeMount(() => {
    node.value = store.getters.getNode(id);
    if (node.value.meta) {
      for (let property in node.value.meta) {
        meta.value[property] = node.value.meta[property];
      }
    }
  });

  watch(meta, value => store.commit('updateNodeMeta', { id, meta: value }), { deep: true });
};
