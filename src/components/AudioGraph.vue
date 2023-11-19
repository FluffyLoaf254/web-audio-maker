<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, onBeforeUpdate } from 'vue';
import AddButton from './AddButton.vue';
import AddMenu from './AddMenu.vue';
import AudioNode from './AudioNode.vue';
import AudioWire from './AudioWire.vue';
import FooterBar from './FooterBar.vue';
import GuidedTutorial from './GuidedTutorial.vue';
import HeaderBar from './HeaderBar.vue';
import LoadButton from './LoadButton.vue';
import SaveButton from './SaveButton.vue';
import { v4 as uuid } from 'uuid';
import { WebAudioPlayer } from '../libraries/WebAudioPlayer';
import { useGraphStore } from '../composables/graphStore';
import { type InputType, type Node, type NodeType, type Position, type Wire, type PartialWire, isFullWire } from '../types';
import { OutputType } from '../types';

const store = useGraphStore();

const mousePosition = ref({
  x: 0,
  y: 0,
});
const panStartPosition = ref({
  x: 0,
  y: 0,
});
const dragStartPosition = ref({
  x: 0,
  y: 0,
});
const size = ref({
  width: 0,
  height: 0,
});
const panning = ref(false);
const dragRef = ref<string|null>(null);
const addMenuOpen = ref(false);
const currentWire = ref<PartialWire|null>(null);
const playing = ref<string|null>(null);
const maximized = ref<string|null>(null);
const lastTouches = ref<TouchList|null>(null);
const graph = ref<HTMLElement|null>(null);

let player: WebAudioPlayer | null = null;

const setSize = () => {
  size.value.width = convertPixelsToRem(graph.value?.clientWidth ?? 0);
  size.value.height = convertPixelsToRem(graph.value?.clientHeight ?? 0);
};

onMounted(() => {
  setSize();
  window.addEventListener('resize', setSize);
  reload();
});

onUnmounted(() => {
  window.removeEventListener('resize', setSize);
});

const bpm = computed({
  get() {
    return store.json.settings.bpm;
  },
  set(value: number) {
    if (value <= 0) {
      return;
    }
    store.updateBpm(value);
    if (player) {
      player.bpm = value;
    }
  },
});

const looping = computed({
  get() {
    return store.json.settings.looping;
  },
  set(value) {
    store.updateLooping(value);
    if (player) {
      player.looping = value;
    }
  },
});

const position = computed({
  get() {
    return store.json.settings.position;
  },
  set(value) {
    store.updatePosition(value);
  },
});

const nodes = computed(() => {
  return store.json.nodes;
});

const wires = computed(() => {
  return store.json.wires;
});

const graphPosition = computed(() => {
  const position = {
    x: 0,
    y: 0,
  };
  if (graph.value) {
    let rect = graph.value.getBoundingClientRect();
    position.x = rect.x;
    position.y = rect.y;
  }

  return position;
});

const dragPosition = computed(() => {
  return {
    x: mousePosition.value.x - dragStartPosition.value.x,
    y: mousePosition.value.y - dragStartPosition.value.y,
  };
});

const panPosition = computed(() => {
  return {
    x: panning.value ? mousePosition.value.x - panStartPosition.value.x : 0,
    y: panning.value ? mousePosition.value.y - panStartPosition.value.y : 0,
  };
});

const finalPosition = computed({
  get() {
    return {
      x: position.value.x + panPosition.value.x,
      y: position.value.y + panPosition.value.y,
    };
  },
  set(value) {
    position.value.x = value.x + panPosition.value.x;
    position.value.y = value.y + panPosition.value.y;
  },  
});

const saveJson = () => {
  let blob = new Blob([JSON.stringify(store.json)], { type: "application/json" });
  let url = URL.createObjectURL(blob);
  let link = document.createElement('a');
  link.href = url;
  link.download = 'audio-graph.json';
  link.click();
  URL.revokeObjectURL(url);
};

const loader = ref<HTMLInputElement|null>(null);

const selectLoadJsonFile = () => {
  loader.value?.click();
};

const loadJson = (event: Event) => {
  if (!event.target) {
    return;
  }
  const target = event.target as HTMLInputElement;
  const file = target.files && target.files[0] ? target.files[0] : null;

  if (!file) {
    return;
  }
  
  const reader = new FileReader();

  reader.onload = (event: ProgressEvent) => {
    if (!event.target) {
      return;
    }
    const target = event.target as FileReader;
    const json = JSON.parse(target.result as string);
    store.load(json);
    reload();
  };

  reader.readAsText(file);
};

const reload = () => {
  player = new WebAudioPlayer(store.json);
  player.bpm = bpm.value;
  player.looping = looping.value;
};

const play = () => {
  if (!player) {
    return;
  }
  if (!player.playing) {
    playing.value = null;
  }
  player.stop();
  if (playing.value == 'play') {
    playing.value = null;
    return;
  }
  player.play();
  playing.value = 'play';
};

const playUpTo = (nodeId: string) => {
  if (!player) {
    return;
  }
  if (!player.playing) {
    playing.value = null;
  }
  player.stop();
  if (playing.value == 'playUpTo') {
    playing.value = null;
    return;
  }
  player.playUpTo(nodeId);
  playing.value = 'playUpTo';
};

const playNode = (nodeId: string) => {
  if (!player) {
    return;
  }
  if (!player.playing) {
    playing.value = null;
  }
  player.stop();
  if (playing.value == 'playNode') {
    playing.value = null;
    return;
  }
  player.playNode(nodeId);
  playing.value = 'playNode';
};

const startDrag = (event: MouseEvent | TouchEvent, node: Node) => {
  if (Boolean(maximized.value)) {
    return;
  }
  setMousePosition(event);
  dragStartPosition.value = {
    x: mousePosition.value.x,
    y: mousePosition.value.y,
  };
  nodes.value.forEach(item => {
    if (item.order >= node.order && item.id != node.id) {
      store.updateNodeOrder({ id: item.id, order: item.order - 1 });
    }
  });
  store.updateNodeOrder({ id: node.id, order: nodes.value.length });
  dragRef.value = node.ref;
};

const endDrag = (node: Node) => {
  if (dragRef.value != node.ref) {
    return;
  }
  store.updateNodePosition({ id: node.id, position: {
    x: node.position.x + dragPosition.value.x,
    y: node.position.y + dragPosition.value.y,
  } });
  dragRef.value = null;
};

const startPan = (event: MouseEvent | TouchEvent) => {
  if (maximized.value) {
    return;
  }
  setMousePosition(event);
  panStartPosition.value = {
    x: mousePosition.value.x,
    y: mousePosition.value.y,
  };
  panning.value = true;
};

const endPan = () => {
  if (dragRef.value) {
    const node = nodes.value?.find(node => node.ref == dragRef.value);
    if (node) {
      endDrag(node);
    }
    return;
  }
  finalPosition.value = {
    x: position.value.x,
    y: position.value.y,
  };
  panning.value = false;
  position.value = finalPosition.value;
};

const convertPixelsToRem = (pixels: number): number => {
  return pixels / parseFloat(getComputedStyle(document.documentElement).fontSize);
};

function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  return event.hasOwnProperty('touches');
}

const setMousePosition = (event: MouseEvent | TouchEvent) => {
  if (isTouchEvent(event)) {
    lastTouches.value = event.touches;
    mousePosition.value = {
      x: convertPixelsToRem(event.touches[0].pageX - graphPosition.value.x),
      y: convertPixelsToRem(event.touches[0].pageY - graphPosition.value.y),
    };
  } else {
    mousePosition.value = {
      x: convertPixelsToRem(event.offsetX - graphPosition.value.x),
      y: convertPixelsToRem(event.offsetY - graphPosition.value.y),
    };
    
    let rect = (event.target as Element).getBoundingClientRect();

    mousePosition.value.x += convertPixelsToRem(rect.x);
    mousePosition.value.y += convertPixelsToRem(rect.y);
  }
};

const addNode = (type: NodeType) => {
  const id = uuid();
  const node = {
    id,
    name: type.name,
    position: {
      x: (size.value.width / 2) - 9 - finalPosition.value.x,
      y: (size.value.height / 2) - 9 - finalPosition.value.y,
    },
    ref: 'node-' + id,
    order: nodes.value.length + 1,
    outputs: [],
    inputs: [],
    audioParamInputs: [],
    audioParamOutputs: [],
    execIn: [],
    execOut: [],
    data: {},
    meta: {},
    beats: type.beats,
    type: type.type,
  };
  store.addNode(node)
};

const startConnection = (event: MouseEvent | TouchEvent, nodeId: string, outputType: OutputType, output: number | string, position: Position, color: string) => {
  setMousePosition(event);
  const id = uuid();
  const node = nodes.value.find(node => node.id == nodeId);
  if (!node) {
    return;
  }
  currentWire.value = {
    id,
    outputNode: node.id,
    outputPosition: position,
    output,
    outputType,
    inputNode: null,
    inputPosition: null,
    input: null,
    inputType: null,
    color,
  };
};

const nodeRefs = ref<Record<string, InstanceType<typeof AudioNode>>>({});

onBeforeUpdate(() => {
  nodeRefs.value = {};
});

const abortConnection = () => {
  if (!currentWire.value) {
    return;
  }

  const nodeRef: string | undefined = nodes.value?.find(node => node.id == currentWire.value?.outputNode)?.ref;

  if (nodeRef) {
    nodeRefs.value[nodeRef].abort();
  }
  currentWire.value = null;
};

const hookConnection = (nodeId: string, inputType: InputType, input: string | number, position: Position) => {
  if (!currentWire.value) {
    return;
  }

  if (currentWire.value.outputNode == nodeId 
    || (inputType == 'execIn' && currentWire.value.outputType != 'execOut') 
    || (inputType == 'inputs' && currentWire.value.outputType != 'outputs')
    || (inputType == 'audioParamInputs' && currentWire.value.outputType != 'audioParamOutputs')) {
    abortConnection();
    return;
  }

  currentWire.value.inputNode = nodeId;
  currentWire.value.inputPosition = position;
  currentWire.value.input = input;
  currentWire.value.inputType = inputType;
  store.addWire(currentWire.value as Wire);
  abortConnection();
};

const hookConnectionMobile = () => {
  if (!currentWire.value || !lastTouches.value) {
    return;
  }
  const element = document.elementFromPoint(lastTouches.value[0].pageX, lastTouches.value[0].pageY);
  if (element) {
    const event = new Event('mouseup', { 'bubbles': true, 'cancelable': true });
    element.dispatchEvent(event);
  }
};

const deleteConnection = (nodeId: string, type: InputType, param: string | number) => {
  const wire = wires.value.find(wire => wire.inputNode == nodeId && wire.inputType == type && wire.input == param);
  if (!wire) {
    return;
  }
  store.removeWire(wire);
};

const deleteNode = (id: string) => {
  const node = nodes.value.find(node => node.id == id);
  if (!node) {
    return;
  }
  nodes.value.forEach(item => {
    if (item.order >= node.order && item.id != node.id) {
      store.updateNodeOrder({ id: item.id, order: item.order - 1 });
    }
  });
  store.removeNode(id);
};

const calculateStart = (wire: PartialWire) => {
  let outputNode = nodes.value.find(node => node.id == wire.outputNode);
  return {
    x: (outputNode ? outputNode.position.x + (outputNode.ref == dragRef.value ? dragPosition.value.x : 0) : 0) + convertPixelsToRem(wire.outputPosition.x),
    y: (outputNode ? outputNode.position.y + (outputNode.ref == dragRef.value ? dragPosition.value.y : 0) : 0) + convertPixelsToRem(wire.outputPosition.y),
  };
};

const calculateEnd = (wire: PartialWire | Wire) => {
  let inputNode = nodes.value.find(node => node.id == wire.inputNode);
  return currentWire.value?.id == wire.id ? {
    x: mousePosition.value.x - finalPosition.value.x,
    y: mousePosition.value.y - finalPosition.value.y,
  } : {
    x: (inputNode ? inputNode.position.x + (inputNode.ref == dragRef.value ? dragPosition.value.x : 0) : 0) + (isFullWire(wire) ? convertPixelsToRem(wire.inputPosition.x) : 0),
    y: (inputNode ? inputNode.position.y + (inputNode.ref == dragRef.value ? dragPosition.value.y : 0) : 0) +  (isFullWire(wire) ? convertPixelsToRem(wire.inputPosition.y) : 0),
  };
};

const handleMaximized = (nodeId: string | null) => {
  if (playing.value != 'play') {
    player?.stop();
    playing.value = null;
  }
  if (nodeId) {
    addMenuOpen.value = false;
    maximized.value = nodeId;
  } else {
    maximized.value = null;
  }
};

const search = (input: string) => {
  const node = nodes.value.find(node => node.name.toLowerCase().includes(input.toLowerCase()));
  if (!node) {
    return;
  }
  position.value.x = -node.position.x + size.value.width / 2 - 9;
  position.value.y = -node.position.y + size.value.height / 2 - 9;
  position.value = finalPosition.value;
};

const tutorial = ref<InstanceType<typeof GuidedTutorial>|null>(null);

const showTutorial = () => {
  tutorial.value?.begin();
};
</script>

<template>
  <div class="grid grid-cols-1 h-full divide-y divide-white dark:divide-black" style="grid-template-rows: min-content minmax(0, 1fr) min-content;">
    <header-bar v-model:bpm.number="bpm" @tutorial="showTutorial">WebAudioMaker</header-bar>
    <div class="flex w-full h-full overflow-hidden md:overflow-visible relative">
      <div class="flex w-full h-full relative md:ml-0 transition-all md:overflow-hidden" :class="{ '-ml-64': addMenuOpen }">
        <div class="relative overflow-hidden bg-gradient-to-tr from-purple-500 to-pink-500 w-screen md:w-full h-full" ref="graph" @mousemove="setMousePosition($event)" @touchmove="setMousePosition($event)" @mouseup="abortConnection" @touchend="abortConnection">
          <div class="absolute left-2 top-2 flex flex-col gap-2">
            <save-button @click="saveJson" @mousemove.stop @touchmove.stop :data-tutorial="!maximized ? 'Use this button to save your audio graph to a JSON file.' : ''" />
            <load-button @click="selectLoadJsonFile" @mousemove.stop @touchmove.stop :data-tutorial="!maximized ? 'Use this button to load an audio graph from a JSON file.' : ''" />
            <input ref="loader" @change="loadJson($event)" type="file" class="hidden">
          </div>
          <div class="bg-repeat w-full h-full" :class="{ 'cursor-grab': !panning, 'cursor-grabbing': panning }" @mousedown.self="startPan($event)" @touchstart.self="startPan($event)" @mouseup.self="endPan" @touchend.self="endPan" @mouseleave="endPan" style="background-size: 3rem 3rem; background-image: radial-gradient(circle at center, rgba(255, 255, 255, 0.5) 0, rgba(255, 255, 255, 0.5) 0.5rem, transparent 0.5rem, transparent 3rem);" :style="{ 'background-position': finalPosition.x + 'rem ' + finalPosition.y + 'rem' }">
            <transition-group name="pop">
              <audio-node :node="node" @mobile-connection="hookConnectionMobile" @play-node="playNode" @play-up-to-node="playUpTo" @mousedown="startDrag($event, node)" @touchstart="startDrag($event, node)" @mouseup="endDrag(node)" @touchend="endDrag(node)" @start-connection="startConnection" @hook-connection="hookConnection" @abort-connection="abortConnection" @delete-connection="deleteConnection" @delete-node="deleteNode" @maximized="handleMaximized" v-for="node in nodes" :ref="(el: any) => nodeRefs[node.ref] = el" :key="node.id" :style="{ 'z-index': (maximized == node.id) ? 200 : Math.floor((node.order / Math.max(1.0, nodes.length)) * 100.0), left: finalPosition.x + node.position.x + (node.ref == dragRef ? dragPosition.x : 0) + 'rem', top: finalPosition.y + node.position.y + (node.ref == dragRef ? dragPosition.y : 0) + 'rem' }" :showTutorial="maximized == null" />
            </transition-group>
            <audio-wire :style="{ left: finalPosition.x + 'rem', top: finalPosition.y + 'rem' }" v-for="wire in wires" :key="wire.id" :start="calculateStart(wire)" :end="calculateEnd(wire)" :color="wire.color" />
            <audio-wire v-if="currentWire != null" :style="{ left: finalPosition.x + 'rem', top: finalPosition.y + 'rem' }" :start="calculateStart(currentWire)" :end="calculateEnd(currentWire)" :color="currentWire.color" />
          </div>
          <add-button class="absolute right-2 bottom-2" @click="addMenuOpen = !addMenuOpen" @mousemove.stop @touchmove.stop :data-tutorial="!maximized ? 'Use this button to open the menu for adding new audio graph nodes. This is the place to start.' : ''" />
        </div>
        <add-menu class="absolute h-full -right-64 md:relative md:right-0 transition-all" :class="{ 'md:w-64': addMenuOpen, 'md:w-0': !addMenuOpen, 'invisible': !addMenuOpen }" @add="addNode" />
      </div>
    </div>
    <footer-bar @search="search" @play="play" v-model:looping="looping" />
    <guided-tutorial ref="tutorial" />
  </div>
</template>
