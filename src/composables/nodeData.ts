import { watch, onBeforeMount, type Ref } from 'vue';
import { useStore } from '../store';
import { type Node, type NodeData } from '../types';

export function useNodeData(id: string, node: Ref<Node | null>, data: Ref<NodeData>) {
  const store = useStore();
  
  onBeforeMount(() => {
    node.value = store.getters.getNode(id);
    if (node.value.data) {
      for (let property in node.value.data) {
        data.value[property] = node.value.data[property];
      }
    }
  });

  watch(data, value => store.commit('updateNodeData', { id, data: value }), { deep: true });
};
