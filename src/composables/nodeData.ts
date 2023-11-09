import { watch, onBeforeMount, type Ref } from 'vue';
import { useStore } from '../store';
import { type Node, type NodeData } from '../types';

export function useNodeData(id: string, node: Ref<Node | null>, data: Ref<NodeData>, meta: Ref<any> | null = null) {
  const store = useStore();
  
  onBeforeMount(() => {
    node.value = store.getters.getNode(id);
    if (node.value.data) {
      for (let property in node.value.data) {
        data.value[property] = node.value.data[property];
      }
    }
    if (meta && node.value.meta) {
      for (let property in node.value.meta) {
        meta.value[property] = node.value.meta[property];
      }
    }
  });

  watch(data, value => store.commit('updateNodeData', { id, data: value }), { deep: true });
  
  if (meta) {
    watch(meta, value => store.commit('updateNodeMeta', { id, meta: value }), { deep: true });
  }
};
