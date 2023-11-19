import { watch, onBeforeMount, type Ref } from 'vue';
import { useGraphStore } from './graphStore';
import { type Node } from '../types';

export function useNodeMeta(id: string, node: Ref<Node | null>, meta: Ref<any>) {
  const store = useGraphStore();
  
  onBeforeMount(() => {
    node.value = store.getNode(id);
    if (node.value.meta) {
      for (let property in node.value.meta) {
        meta.value[property] = node.value.meta[property];
      }
    }
  });

  watch(meta, value => store.updateNodeMeta({ id, meta: value }), { deep: true });
};
