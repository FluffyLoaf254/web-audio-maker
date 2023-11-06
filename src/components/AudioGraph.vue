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
import { useStore } from '../store';

const store = useStore();

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
const dragRef = ref(null);
const addMenuOpen = ref(false);
const currentWire = ref(null);
const playing = ref(null);
const maximized = ref(null);
const lastTouches = ref(null);
const graph = ref(null);

let player = null;

const setSize = () => {
  size.value.width = convertPixelsToRem(graph.value.clientWidth);
  size.value.height = convertPixelsToRem(graph.value.clientHeight);
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
    return store.state.json.settings.bpm;
  },
  set(value) {
    if (value == '' || value <= 0) {
      return;
    }
    store.commit('updateBpm', value);
    player.bpm = value;
  },
});

const looping = computed({
  get() {
    return store.state.json.settings.looping;
  },
  set(value) {
    store.commit('updateLooping', value);
    player.looping = value;
  },
});

const position = computed({
  get() {
    return store.state.json.settings.position;
  },
  set(value) {
    store.commit('updatePosition', value);
  },
});

const nodes = computed(() => {
  return store.state.json.nodes;
});

const wires = computed(() => {
  return store.state.json.wires;
});

const graphPosition = computed(() => {
  const position = {
    x: 0,
    y: 0,
  };
  let rect = graph.value.getBoundingClientRect();
  position.x = rect.x;
  position.y = rect.y;

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
      x: Math.min(0, Math.max(-500 + size.value.width, position.value.x + panPosition.value.x)),
      y: Math.min(0, Math.max(-500 + size.value.height, position.value.y + panPosition.value.y)),
    };
  },
  set(value) {
    position.value.x = Math.min(0, Math.max(-500 + size.value.width, value.x + panPosition.value.x));
    position.value.y = Math.min(0, Math.max(-500 + size.value.height, value.y + panPosition.value.y));
  },  
});

const saveJson = () => {
  let blob = new Blob([JSON.stringify(store.state.json)], { type: "application/json" });
  let url = URL.createObjectURL(blob);
  let link = document.createElement('a');
  link.href = url;
  link.download = 'audio-graph.json';
  link.click();
  URL.revokeObjectURL(url);
};

const loader = ref(null);

const selectLoadJsonFile = () => {
  loader.value.click();
};

const loadJson = (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = (event) => {
    const json = JSON.parse(event.target.result as string);
    store.commit('load', json);
    reload();
  };

  reader.readAsText(file);
};

const reload = () => {
  player = new WebAudioPlayer(store.state.json);
  player.bpm = bpm.value;
  player.looping = looping.value;
};

const play = () => {
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

const playUpTo = (nodeId) => {
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

const playNode = (id) => {
  if (!player.playing) {
    playing.value = null;
  }
  player.stop();
  if (playing.value == 'playNode') {
    playing.value = null;
    return;
  }
  player.playNode(id);
  playing.value = 'playNode';
};

const startDrag = (event, node) => {
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
      store.commit('updateNodeOrder', { id: item.id, order: item.order - 1 });
    }
  });
  store.commit('updateNodeOrder', { id: node.id, order: nodes.value.length });
  dragRef.value = node.ref;
};

const endDrag = (node) => {
  if (dragRef.value != node.ref) {
    return;
  }
  store.commit('updateNodePosition', { id: node.id, position: {
    x: node.position.x + dragPosition.value.x,
    y: node.position.y + dragPosition.value.y,
  } });
  dragRef.value = null;
};

const startPan = (event) => {
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
    endDrag(nodes.value.find(node => node.ref == dragRef.value));
    return;
  }
  finalPosition.value = {
    x: position.value.x,
    y: position.value.y,
  };
  panning.value = false;
  position.value = finalPosition.value;
};

const convertPixelsToRem = (pixels) => {
  return pixels / parseFloat(getComputedStyle(document.documentElement).fontSize);
};

const setMousePosition = (event) => {
  if (event.touches) {
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
    
    let rect = event.target.getBoundingClientRect();

    mousePosition.value.x += convertPixelsToRem(rect.x);
    mousePosition.value.y += convertPixelsToRem(rect.y);
  }
};

const addNode = (node) => {
  const id = uuid();
  const added = {
    id,
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
    beats: node.beats,
    type: node.type,
  };
  store.commit('addNode', added)
};

const startConnection = (event, nodeId, outputType, output, position, color) => {
  setMousePosition(event);
  const id = uuid();
  const node = nodes.value.find(node => node.id == nodeId);
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

const nodeRefs = ref([]);

onBeforeUpdate(() => {
  nodeRefs.value = [];
});

const abortConnection = () => {
  if (!currentWire.value) {
    return;
  }

  nodeRefs.value[nodes.value.find(node => node.id == currentWire.value.outputNode).ref].abort();
  currentWire.value = null;
};

const hookConnection = (nodeId, inputType, input, position) => {
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
  store.commit('addWire', currentWire.value);
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

const deleteConnection = (nodeId, type, param) => {
  const wire = wires.value.find(wire => wire.inputNode == nodeId && wire.inputType == type && wire.input == param);
  if (!wire) {
    return;
  }
  store.commit('removeWire', wire);
};

const deleteNode = (id) => {
  const node = nodes.value.find(node => node.id == id);
  nodes.value.forEach(item => {
    if (item.order >= node.order && item.id != node.id) {
      store.commit('updateNodeOrder', { id: item.id, order: item.order - 1 });
    }
  });
  store.dispatch('removeNode', id);
};

const calculateStart = (wire) => {
  let outputNode = nodes.value.find(node => node.id == wire.outputNode);
  return {
    x: outputNode.position.x + (outputNode.ref == dragRef.value ? dragPosition.value.x : 0) + convertPixelsToRem(wire.outputPosition.x),
    y: outputNode.position.y + (outputNode.ref == dragRef.value ? dragPosition.value.y : 0) + convertPixelsToRem(wire.outputPosition.y),
  };
};

const calculateEnd = (wire) => {
  let inputNode = nodes.value.find(node => node.id == wire.inputNode);
  return currentWire.value?.id == wire.id ? {
    x: mousePosition.value.x - finalPosition.value.x,
    y: mousePosition.value.y - finalPosition.value.y,
  } : {
    x: inputNode.position.x + (inputNode.ref == dragRef.value ? dragPosition.value.x : 0) + convertPixelsToRem(wire.inputPosition.x),
    y: inputNode.position.y + (inputNode.ref == dragRef.value ? dragPosition.value.y : 0) +  convertPixelsToRem(wire.inputPosition.y),
  };
};

const handleMaximized = (nodeId) => {
  if (playing.value != 'play') {
    player.stop();
    playing.value = null;
  }
  if (nodeId) {
    addMenuOpen.value = false;
    maximized.value = nodeId;
  } else {
    maximized.value = null;
  }
};

const changeBeats = (nodeId, beats) => {
  const node = nodes.value.find(node => node.id == nodeId);
  store.commit('updateNodeBeats', { id: node.id, beats: beats });
};

const search = (input) => {
  const node = nodes.value.find(node => node.name.toLowerCase().includes(input.toLowerCase()));
  if (!node) {
    return;
  }
  position.value.x = -node.position.x + size.value.width / 2 - 9;
  position.value.y = -node.position.y + size.value.height / 2 - 9;
  position.value = finalPosition.value;
};

const tutorial = ref(null);

const showTutorial = () => {
  tutorial.value.begin();
};
</script>

<template>
  <div class="grid grid-cols-1 h-screen divide-y" style="grid-template-rows: min-content minmax(0, 1fr) min-content;">
    <header-bar v-model:bpm.number="bpm" @tutorial="showTutorial">WebAudioMaker</header-bar>
    <div class="flex w-full h-full overflow-hidden md:overflow-visible relative">
      <div class="flex w-full h-full relative md:ml-0 transition-all md:overflow-hidden" :class="{ '-ml-64': addMenuOpen }">
        <div class="relative overflow-hidden bg-gradient-to-tr from-purple-500 to-pink-500 w-screen md:w-full h-full" ref="graph" @mousemove="setMousePosition($event)" @touchmove="setMousePosition($event)" @mouseup="abortConnection" @touchend="abortConnection">
          <div class="absolute left-2 top-2 flex flex-col gap-2">
            <save-button @click="saveJson" @mousemove.stop @touchmove.stop data-tutorial="Use this button to save your audio graph to a JSON file." />
            <load-button @click="selectLoadJsonFile" @mousemove.stop @touchmove.stop data-tutorial="Use this button to load an audio graph from a JSON file." />
            <input ref="loader" @change="loadJson($event)" type="file" class="hidden">
          </div>
          <div class="bg-repeat min-w-full min-h-full" :class="{ 'cursor-grab': !panning, 'cursor-grabbing': panning }" @mousedown.self="startPan($event)" @touchstart.self="startPan($event)" @mouseup.self="endPan" @touchend.self="endPan" @mouseleave="endPan" style="width: 500rem; height: 500rem; background-size: 3rem 3rem; background-image: radial-gradient(circle at center, rgba(255, 255, 255, 0.5) 0, rgba(255, 255, 255, 0.5) 0.5rem, transparent 0.5rem, transparent 3rem);" :style="{ 'margin-left': finalPosition.x + 'rem', 'margin-top': finalPosition.y + 'rem' }">
            <transition-group name="pop">
              <audio-node :node="node" @mobile-connection="hookConnectionMobile" @change-beats="changeBeats" @play-node="playNode" @play-up-to-node="playUpTo" @mousedown="startDrag($event, node)" @touchstart="startDrag($event, node)" @mouseup="endDrag(node)" @touchend="endDrag(node)" @start-connection="startConnection" @hook-connection="hookConnection" @abort-connection="abortConnection" @delete-connection="deleteConnection" @delete-node="deleteNode" @maximized="handleMaximized" v-for="node in nodes" :ref="el => nodeRefs[node.ref] = el" :key="node.id" :style="{ 'z-index': (maximized == node.id) ? 200 : Math.floor((node.order / Math.max(1.0, nodes.length)) * 100.0), left: finalPosition.x + node.position.x + (node.ref == dragRef ? dragPosition.x : 0) + 'rem', top: finalPosition.y + node.position.y + (node.ref == dragRef ? dragPosition.y : 0) + 'rem' }" />
            </transition-group>
            <audio-wire :style="{ left: finalPosition.x + 'rem', top: finalPosition.y + 'rem' }" v-for="wire in wires" :key="wire.id" :start="calculateStart(wire)" :end="calculateEnd(wire)" :color="wire.color" />
            <audio-wire v-if="Boolean(currentWire)" :style="{ left: finalPosition.x + 'rem', top: finalPosition.y + 'rem' }" :start="calculateStart(currentWire)" :end="calculateEnd(currentWire)" :color="currentWire.color" />
          </div>
          <add-button class="absolute right-2 bottom-2" @click="addMenuOpen = !addMenuOpen" @mousemove.stop @touchmove.stop data-tutorial="Use this button to open the menu for adding new audio graph nodes. This is the place to start." />
        </div>
        <add-menu class="absolute h-full -right-64 md:relative md:right-0 transition-all" :class="{ 'md:w-64': addMenuOpen, 'md:w-0': !addMenuOpen }" @add="addNode" />
      </div>
    </div>
    <footer-bar @search="search" @play="play" v-model:looping="looping" />
    <guided-tutorial ref="tutorial" />
  </div>
</template>
