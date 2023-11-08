<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from '../store';
import { v4 as uuid } from 'uuid';
import NodeInput from './NodeInput.vue';
import NodeOutput from './NodeOutput.vue';
import AudioParamInput from './AudioParamInput.vue';
import AudioParamOutput from './AudioParamOutput.vue';
import ExecInPin from './ExecInPin.vue';
import ExecOutPin from './ExecOutPin.vue';
import IconButton from './IconButton.vue';
import FormInput from './FormInput.vue';
import InputLabel from './InputLabel.vue';
import MessageModal from './MessageModal.vue';
import { ArrowDownIcon, ArrowsPointingOutIcon, InformationCircleIcon, MusicalNoteIcon, XMarkIcon } from '@heroicons/vue/24/solid';
import { type InputType, type Node, type OutputType, type Position } from '../types';
import { watch } from 'vue';

interface Props {
  node: Node
}

type Emits = {
  mobileConnection: []
  startConnection: [event: Event, id: string, type: OutputType, param: string | number, position: Position, color: string]
  hookConnection: [id: string, type: InputType, param: string | number, position: Position]
  abortConnection: []
  deleteConnection: [id: string, type: InputType, param: string | number]
  deleteNode: [id: string]
  playNode: [id: string]
  playUpToNode: [id: string]
  maximized: [id: string | null]
  changeBeats: [id: string, beats: number]
}

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

const maximized = ref(false);
const recentlyTransitioned = ref(false);
const extraClasses = ref('');
const dragging = ref(null);
const noteShown = ref(false);
const noteParent = ref(null);
const noteKey = ref(uuid());
const width = ref(0);
const height = ref(0);

const container = ref(null);

const store = useStore();

const typeObject = computed(() => {
  return store.getters.typeOf(props.node);
});
const categoryObject = computed(() => {
  return store.getters.categoryOf(typeObject.value);
});
const maximizedClasses = computed(() => {
  return maximized.value ? 'cursor-auto rounded-none !left-0 !top-0 min-h-0 min-w-0' + extraClasses.value : 'min-h-max min-w-max w-auto h-auto';
});
const transitionStyles = computed(() => {
  return recentlyTransitioned.value ? 'width: ' + width.value + 'px; height: ' + height.value + 'px; transition: left 0.5s ease, top 0.5s ease, width 0.5s ease, height 0.5s ease;' : 'transition: none;';
});

watch(maximized, (value) => {
  if (value) {
    width.value = container.value.offsetWidth;
    height.value = container.value.offsetHeight;
  }
  recentlyTransitioned.value = true;
  setTimeout(() => recentlyTransitioned.value = false, 500);
  if (value) {
    setTimeout(() => extraClasses.value = ' !h-full !w-full', 10);
    emit('maximized', props.node.id);
  } else {
    extraClasses.value = '';
    emit('maximized', null);
  }
});

const abort = () => {
  dragging.value = null;
};

const startConnectionDrag = (event, type, param, color) => {
  dragging.value = { type, param };
  const position = {
    x: 16,
    y: 16,
  };
  let current = event.target;
  while (current != container.value) {
    if (!(current instanceof HTMLElement)) {
      current = current.parentNode;
      continue;
    }
    position.x += current.offsetLeft;
    position.y += current.offsetTop;
    current = current.offsetParent;
  }
  emit('startConnection', event, props.node.id, type, param, position, color);
};

const isHooked = (type, param) => {
  return (dragging.value && dragging.value.type == type && dragging.value.param == param)
    || props.node[type].some(connection => (connection.input || connection.output) == param);
};

const endConnectionDrag = (event, type, input) => {
  abort();
  if (isHooked(type, input)) {
    emit('abortConnection');
    return;
  }
  const position = {
    x: 16,
    y: 16,
  };
  let current = event.target;
  while (current != container.value) {
    if (!(current instanceof HTMLElement)) {
      current = current.parentNode;
      continue;
    }
    position.x += current.offsetLeft;
    position.y += current.offsetTop;
    current = current.offsetParent;
  }
  emit('hookConnection', props.node.id, type, input, position);
};

const endConnectionMobile = () => {
  emit('mobileConnection');
};

const playNode = () => {
  emit('playNode', props.node.id);
};

const playUpToNode = () => {
  emit('playUpToNode', props.node.id);
};

const changeBeats = (beats) => {
  emit('changeBeats', props.node.id, beats);
};

const showNote = (event) => {
  noteParent.value = event.target;
  noteShown.value = true;
  noteKey.value = uuid();
};

defineExpose({
  abort,
});
</script>

<template>
  <div class="select-none absolute cursor-move overflow-hidden bg-gray-50 shadow-md rounded" :class="maximizedClasses" ref="container" :style="transitionStyles">
    <div v-if="!maximized" class="flex flex-col h-full">
      <div class="flex bg-white w-full justify-between items-center gap-4 p-2 border-l-8" :style="{ 'border-color': categoryObject.color }">
        <span>{{ typeObject.name }}</span>
        <div class="flex gap-2">
          <icon-button @mousedown.stop @touchstart.stop @click.capture="showNote($event)" label="Node Information">
            <information-circle-icon class="h-5 w-5" />
          </icon-button>
          <icon-button v-if="typeObject.component" @mousedown.stop @touchstart.stop @click="maximized = true" label="Maximize Node">
            <arrows-pointing-out-icon class="h-5 w-5" />
          </icon-button>
          <icon-button @mousedown.stop @touchstart.stop @click="$emit('deleteNode', node.id)" label="Delete Node">
            <x-mark-icon class="h-5 w-5" />
          </icon-button>
        </div>
      </div>
      <div class="flex-grow h-full grid grid-cols-2 divide-x p-4">
        <div class="flex flex-col items-start gap-2 pr-4">
          <exec-in-pin v-for="number in typeObject.numberOfExecIn" :key="number" :hooked="isHooked('execIn', number)" @click="$emit('deleteConnection', node.id, 'execIn', number)" @mousedown.stop @touchstart.stop @mouseup="endConnectionDrag($event, 'execIn', number)" />
          <node-input v-for="number in typeObject.numberOfInputs" :key="number" :hooked="isHooked('inputs', number)" @click="$emit('deleteConnection', node.id, 'inputs', number)" @mousedown.stop @touchstart.stop @mouseup="endConnectionDrag($event, 'inputs', number)" />
          <audio-param-input v-for="param in typeObject.audioParams" :key="param" :text="param" :hooked="isHooked('audioParamInputs', param)" @click="$emit('deleteConnection', node.id, 'audioParamInputs', param)" @mousedown.stop @touchstart.stop @mouseup="endConnectionDrag($event, 'audioParamInputs', param)" />
        </div>
        <div class="flex flex-col items-end gap-2 pl-4">
          <exec-out-pin v-for="number in typeObject.numberOfExecOut" :key="number" :hooked="isHooked('execOut', number)" @mousedown.stop="startConnectionDrag($event, 'execOut', number, '#3B82F6')" @touchstart.stop="startConnectionDrag($event, 'execOut', number, '#3B82F6')" @touchend="endConnectionMobile" />
          <node-output v-for="number in typeObject.numberOfOutputs" :key="number" :hooked="isHooked('outputs', number)" @mousedown.stop="startConnectionDrag($event, 'outputs', number, 'rgb(168 85 247)')" @touchstart.stop="startConnectionDrag($event, 'outputs', number, 'rgb(168 85 247)')" @touchend="endConnectionMobile" />
          <audio-param-output v-for="number in typeObject.numberOfAudioParamOutputs" :key="number" :hooked="isHooked('audioParamOutputs', number)" @mousedown.stop="startConnectionDrag($event, 'audioParamOutputs', number, 'rgb(236 72 153)')" @touchstart.stop="startConnectionDrag($event, 'audioParamOutputs', number, 'rgb(236 72 153)')" @touchend="endConnectionMobile" />
        </div>
      </div>
      <div class="bg-white flex w-full justify-between items-center gap-4 p-2 h-10">
        <div class="flex items-center gap-2" v-if="node.beats != null">
          <form-input class="w-20" :name="'beats-' + node.id" :id="'beats-' + node.id" :modelValue="node.beats" @mousedown.stop @touchstart.stop @update:modelValue="changeBeats" type="number" min="1" max="120" step="1" />
          <input-label value="Beats" :for="'beats-' + node.id" />
        </div>
        <div v-else></div>
        <icon-button @mousedown.stop @touchstart.stop @click="playUpToNode" v-if="typeObject.category != 'logic'" label="Play Up To Node">
          <musical-note-icon class="h-5 w-5" />
        </icon-button>
      </div>
    </div>
    <div v-else class="flex flex-col h-full">
      <div class="flex bg-white w-full justify-between items-center gap-4 p-2 border-l-8" :style="{ 'border-color': categoryObject.color }">
        <span>{{ typeObject.name }}</span>
        <div class="flex gap-2">
          <icon-button @mousedown.stop @touchstart.stop @click.capture="showNote($event)" label="Node Information">
            <information-circle-icon class="h-5 w-5" />
          </icon-button>
          <icon-button @mousedown.stop @touchstart.stop @click="maximized = false" label="Minimize Node">
            <arrow-down-icon class="h-5 w-5" />
          </icon-button>
        </div>
      </div>
      <div class="flex-grow overflow-y-auto overscroll-y-auto" v-if="typeObject.component">
        <component :is="typeObject.component" v-bind="{ id: node.id }" ref="component"></component>
      </div>
      <div class="bg-white flex w-full justify-end items-center gap-4 p-2 h-10">
        <icon-button v-if="categoryObject.playable" @mousedown.stop @touchstart.stop @click="playNode" label="Play Node">
          <musical-note-icon class="h-5 w-5" />
        </icon-button>
      </div>
    </div>
    <message-modal :key="noteKey" @close="noteShown = false;" :show="Boolean(noteShown)" :parent="noteParent">{{ typeObject.note }}</message-modal>
  </div>
</template>
