<template>
  <div class="select-none absolute cursor-move overflow-hidden bg-gray-50 shadow-md rounded" :class="maximizedClasses" ref="container" :style="transitionStyles">
    <div v-if="!maximized" class="flex flex-col h-full">
      <div class="flex bg-white w-full justify-between items-center gap-4 p-2 border-l-8" :style="{ 'border-color': categoryObject.color }">
        <span>{{ typeObject.name }}</span>
        <div class="flex gap-2">
          <icon-button @mousedown.stop @touchstart.stop @click="showNote($event)">
            <information-circle-icon class="h-5 w-5" />
          </icon-button>
          <message-modal @close="noteShown = false;" :show="Boolean(noteShown)" :parent="noteParent">{{ typeObject.note }}</message-modal>
          <icon-button v-if="typeObject.component" @mousedown.stop @touchstart.stop @click="maximized = true">
            <arrows-pointing-out-icon class="h-5 w-5" />
          </icon-button>
          <icon-button @mousedown.stop @touchstart.stop @click="$emit('delete-node', node.id)">
            <x-mark-icon class="h-5 w-5" />
          </icon-button>
        </div>
      </div>
      <div class="flex-grow h-full grid grid-cols-2 divide-x p-4">
        <div class="flex flex-col items-start gap-2 pr-4">
          <exec-in-pin v-for="number in typeObject.numberOfExecIn" :key="number" :hooked="isHooked('execIn', number)" @click="$emit('delete-connection', node.id, 'execIn', number)" @mousedown.stop @touchstart.stop @mouseup="endConnectionDrag($event, 'execIn', number)" />
          <node-input v-for="number in typeObject.numberOfInputs" :key="number" :hooked="isHooked('inputs', number)" @click="$emit('delete-connection', node.id, 'inputs', number)" @mousedown.stop @touchstart.stop @mouseup="endConnectionDrag($event, 'inputs', number)" />
          <audio-param-input v-for="param in typeObject.audioParams" :key="param" :text="param" :hooked="isHooked('audioParamInputs', param)" @click="$emit('delete-connection', node.id, 'audioParamInputs', param)" @mousedown.stop @touchstart.stop @mouseup="endConnectionDrag($event, 'audioParamInputs', param)" />
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
        <icon-button @mousedown.stop @touchstart.stop @click="playUpToNode" v-if="typeObject.category != 'execution'">
          <musical-note-icon class="h-5 w-5" />
        </icon-button>
      </div>
    </div>
    <div v-else class="flex flex-col h-full">
      <div class="flex bg-white w-full justify-between items-center gap-4 p-2 border-l-8" :style="{ 'border-color': categoryObject.color }">
        <span>{{ typeObject.name }}</span>
        <div class="flex gap-2">
          <icon-button @mousedown.stop @touchstart.stop>
            <information-circle-icon class="h-5 w-5" />
          </icon-button>
          <icon-button @mousedown.stop @touchstart.stop @click="maximized = false">
            <arrow-down-icon class="h-5 w-5" />
          </icon-button>
        </div>
      </div>
      <div class="flex-grow overflow-y-auto overscroll-y-auto" v-if="typeObject.component">
        <component :is="typeObject.component" v-bind="{ id: node.id }" ref="component"></component>
      </div>
      <div class="bg-white flex w-full justify-end items-center gap-4 p-2 h-10">
        <icon-button v-if="categoryObject.playable" @mousedown.stop @touchstart.stop @click="playNode">
          <musical-note-icon class="h-5 w-5" />
        </icon-button>
      </div>
    </div>
  </div>
</template>

<script>
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

  export default {
    components: {
      NodeInput,
      NodeOutput,
      AudioParamInput,
      AudioParamOutput,
      ExecInPin,
      ExecOutPin,
      IconButton,
      ArrowDownIcon,
      ArrowsPointingOutIcon,
      InformationCircleIcon,
      MusicalNoteIcon,
      XMarkIcon,
      FormInput,
      InputLabel,
      MessageModal,
    },

    emits: ['mobile-connection', 'start-connection', 'hook-connection', 'abort-connection', 'delete-connection', 'delete-node', 'play-node', 'play-up-to-node', 'maximized', 'change-beats'],

    props: {
      node: {
        default: {
          id: null,
          type: null,
          beats: null,
          outputs: [],
          inputs: [],
          audioParamInputs: [],
          audioParamOutputs: [],
          execIn: [],
          execOut: [],
        },
      },
    },

    data() {
      return {
        maximized: false,
        recentlyTransitioned: false,
        extraClasses: '',
        dragging: null,
        noteShown: false,
        noteParent: null,
      };
    },

    computed: {
      typeObject() {
        return this.$store.getters.typeOf(this.node);
      },
      categoryObject() {
        return this.$store.getters.categoryOf(this.typeObject);
      },
      maximizedClasses() {
        return this.maximized ? 'cursor-auto rounded-none !left-0 !top-0 min-h-0 min-w-0' + this.extraClasses : 'min-h-max min-w-max w-auto h-auto';
      },
      transitionStyles() {
        return this.recentlyTransitioned ? 'width: 15rem; height: 14rem; transition: left 0.5s ease, top 0.5s ease, width 0.5s ease, height 0.5s ease;' : 'transition: none;';
      },
    },

    watch: {
      maximized(value) {
        this.recentlyTransitioned = true;
        setTimeout(() => this.recentlyTransitioned = false, 500);
        if (value) {
          setTimeout(() => this.extraClasses = ' !h-full !w-full', 10);
          this.$emit('maximized', this.node.id);
        } else {
          this.extraClasses = '';
          this.$emit('maximized', null);
        }
      },
    },

    methods: {
      abort() {
        this.dragging = null;
      },
      startConnectionDrag(event, type, param, color) {
        this.dragging = { type, param };
        const position = {
          x: 16,
          y: 16,
        };
        let current = event.target;
        while (current != this.$refs.container) {
          if (!(current instanceof HTMLElement)) {
            current = current.parentNode;
            continue;
          }
          position.x += current.offsetLeft;
          position.y += current.offsetTop;
          current = current.offsetParent;
        }
        this.$emit('start-connection', this.node.id, type, param, position, color);
      },
      endConnectionDrag(event, type, input) {
        this.abort();
        if (this.isHooked(type, input)) {
          this.$emit('abort-connection');
          return;
        }
        const position = {
          x: 16,
          y: 16,
        };
        let current = event.target;
        while (current != this.$refs.container) {
          if (!(current instanceof HTMLElement)) {
            current = current.parentNode;
            continue;
          }
          position.x += current.offsetLeft;
          position.y += current.offsetTop;
          current = current.offsetParent;
        }
        this.$emit('hook-connection', this.node.id, type, input, position);
      },
      endConnectionMobile() {
        this.$emit('mobile-connection');
      },
      isHooked(type, param) {
        return (this.dragging?.type == type && this.dragging?.param == param)
          || this.node[type].some(connection => (connection.input || connection.output) == param);
      },
      playNode() {
        this.$emit('play-node', this.node.id);
      },
      playUpToNode() {
        this.$emit('play-up-to-node', this.node.id);
      },
      changeBeats(beats) {
        this.$emit('change-beats', this.node.id, beats);
      },
      showNote(event) {
        this.noteParent = event.target;
        this.noteShown = true;
      },
    },
  };
</script>
