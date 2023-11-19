import { watch, onBeforeMount, type Ref } from 'vue';
import { useGraphStore } from './graphStore';
import { type Node, type NodeData } from '../types';

export function useNodeData(id: string, node: Ref<Node | null>, data: Ref<NodeData>) {
  const store = useGraphStore();
  
  onBeforeMount(() => {
    node.value = store.getNode(id);
    if (node.value.data) {
      for (let property in node.value.data) {
        data.value[property] = node.value.data[property];
      }
    }
  });

  watch(data, value => store.updateNodeData({ id, data: value }), { deep: true });
};
