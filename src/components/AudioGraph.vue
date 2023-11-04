<template>
<div class="grid grid-cols-1 h-screen divide-y" style="grid-template-rows: min-content minmax(0, 1fr) min-content;">
  <header-bar @change-bpm="changeBpm" @tutorial="showTutorial">WebAudioMaker</header-bar>
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
            <audio-node :node="node" @mobile-connection="hookConnectionMobile" @change-beats="changeBeats" @play-node="playNode" @play-up-to-node="playUpTo" @mousedown="startDrag($event, node)" @touchstart="startDrag($event, node)" @mouseup="endDrag(node)" @touchend="endDrag(node)" @start-connection="startConnection" @hook-connection="hookConnection" @abort-connection="abortConnection" @delete-connection="deleteConnection" @delete-node="deleteNode" @maximized="handleMaximized" v-for="node in nodes" :ref="node.ref" :key="node.id" :style="{ 'z-index': (maximized == node.id) ? 200 : Math.floor((node.order / Math.max(1.0, nodes.length)) * 100.0), left: finalPosition.x + node.position.x + (node.ref == dragRef ? dragPosition.x : 0) + 'rem', top: finalPosition.y + node.position.y + (node.ref == dragRef ? dragPosition.y : 0) + 'rem' }" />
          </transition-group>
          <audio-wire :style="{ left: finalPosition.x + 'rem', top: finalPosition.y + 'rem' }" v-for="wire in wires" :key="wire.id" :start="calculateStart(wire)" :end="calculateEnd(wire)" :color="wire.color" />
          <audio-wire v-if="Boolean(currentWire)" :style="{ left: finalPosition.x + 'rem', top: finalPosition.y + 'rem' }" :start="calculateStart(currentWire)" :end="calculateEnd(currentWire)" :color="currentWire.color" />
        </div>
        <add-button class="absolute right-2 bottom-2" @click="addMenuOpen = !addMenuOpen" @mousemove.stop @touchmove.stop data-tutorial="Use this button to open the menu for adding new audio graph nodes. This is the place to start." />
      </div>
      <add-menu class="absolute h-full -right-64 md:relative md:right-0 transition-all" :class="{ 'md:w-64': addMenuOpen, 'md:w-0': !addMenuOpen }" @add="addNode" />
    </div>
  </div>
  <footer-bar @search="search" @play="play" @loop="setLooping" />
  <guided-tutorial ref="tutorial" />
</div>
</template>

<script>
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

  export default {
    components: {
      AddButton,
      AddMenu,
      AudioNode,
      AudioWire,
      FooterBar,
      GuidedTutorial,
      HeaderBar,
      LoadButton,
      SaveButton,
    },

    data() {
      return {
        position: {
          x: -250,
          y: -250,
        },
        mousePosition: {
          x: 0,
          y: 0,
        },
        panStartPosition: {
          x: 0,
          y: 0,
        },
        dragStartPosition: {
          x: 0,
          y: 0,
        },
        size: {
          width: 0,
          height: 0,
        },
        nodes: [],
        wires: [],
        panning: false,
        dragRef: null,
        addMenuOpen: false,
        currentWire: null,
        player: null,
        playing: null,
        maximized: null,
        lastTouches: null,
      };
    },

    mounted() {
      this.setSize();
      window.addEventListener('resize', this.setSize);
      this.reload();
    },

    unmounted() {
      window.removeEventListener('resize', this.setSize);
    },

    computed: {
      graphPosition() {
        const position = {
          x: 0,
          y: 0,
        };
        let rect = this.$refs.graph.getBoundingClientRect();
        position.x = rect.x;
        position.y = rect.y;

        return position;
      },
      dragPosition() {
        return {
          x: this.mousePosition.x - this.dragStartPosition.x,
          y: this.mousePosition.y - this.dragStartPosition.y,
        };
      },
      panPosition() {
        return {
          x: this.panning ? this.mousePosition.x - this.panStartPosition.x : 0,
          y: this.panning ? this.mousePosition.y - this.panStartPosition.y : 0,
        };
      },
      finalPosition: {
        get() {
          return {
            x: Math.min(0, Math.max(-500 + this.size.width, this.position.x + this.panPosition.x)),
            y: Math.min(0, Math.max(-500 + this.size.height, this.position.y + this.panPosition.y)),
          };
        },
        set(value) {
          this.position.x = Math.min(0, Math.max(-500 + this.size.width, value.x + this.panPosition.x));
          this.position.y = Math.min(0, Math.max(-500 + this.size.height, value.y + this.panPosition.y));
        },  
      },
    },

    methods: {
      saveJson() {
        let blob = new Blob([JSON.stringify(this.$store.state.json)], { type: "application/json" });
        let url = URL.createObjectURL(blob);
        let link = document.createElement('a');
        link.href = url;
        link.download = 'audio-graph.json';
        link.click();
        URL.revokeObjectURL(url);
      },
      selectLoadJsonFile() {
        this.$refs.loader.click();
      },
      loadJson(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
          const json = JSON.parse(event.target.result);
          this.$store.commit('load', json);
          this.reload();
        };

        reader.readAsText(file);
      },
      reload() {
        this.nodes = this.$store.state.json.nodes;
        this.wires = this.$store.state.json.wires;
        this.player = new WebAudioPlayer(this.$store.state.json);
      },
      changeBpm(value) {
        this.player.bpm = value;
        this.$store.commit('updateBpm', value);
      },
      play() {
        if (!this.player.playing) {
          this.playing = null;
        }
        this.player.stop();
        if (this.playing == 'play') {
          this.playing = null;
          return;
        }
        this.player.play();
        this.playing = 'play';
      },
      playUpTo(nodeId) {
        if (!this.player.playing) {
          this.playing = null;
        }
        this.player.stop();
        if (this.playing == 'playUpTo') {
          this.playing = null;
          return;
        }
        this.player.playUpTo(nodeId);
        this.playing = 'playUpTo';
      },
      playNode(id) {
        if (!this.player.playing) {
          this.playing = null;
        }
        this.player.stop();
        if (this.playing == 'playNode') {
          this.playing = null;
          return;
        }
        this.player.playNode(id);
        this.playing = 'playNode';
      },
      setSize() {
        this.size.width = this.convertPixelsToRem(this.$refs.graph.clientWidth);
        this.size.height = this.convertPixelsToRem(this.$refs.graph.clientHeight);
      },
      startDrag(event, node) {
        if (this.maximized) {
          return;
        }
        this.setMousePosition(event);
        this.dragStartPosition = {
          x: this.mousePosition.x,
          y: this.mousePosition.y,
        };
        this.nodes.forEach(item => {
          if (item.order >= node.order && item.id != node.id) {
            item.order -= 1;
            this.$store.commit('updateNodeOrder', item);
          }
        });
        node.order = this.nodes.length;
        this.$store.commit('updateNodeOrder', node);
        this.dragRef = node.ref;
      },
      endDrag(node) {
        if (this.dragRef != node.ref) {
          return;
        }
        node.position.x += this.dragPosition.x;
        node.position.y += this.dragPosition.y;
        this.dragRef = null;
        this.$store.commit('updateNodePosition', node);
      },
      startPan(event) {
        if (this.maximized) {
          return;
        }
        this.setMousePosition(event);
        this.panStartPosition = {
          x: this.mousePosition.x,
          y: this.mousePosition.y,
        };
        this.panning = true;
      },
      endPan() {
        if (this.dragRef) {
          this.endDrag(this.nodes.find(node => node.ref == this.dragRef));
          return;
        }
        this.finalPosition = {
          x: this.position.x,
          y: this.position.y,
        };
        this.panning = false;
        this.$store.commit('updatePosition', this.finalPosition);
      },
      convertPixelsToRem(pixels) {
        return pixels / parseFloat(getComputedStyle(document.documentElement).fontSize);
      },
      setMousePosition(event) {
        if (event.touches) {
          this.lastTouches = event.touches;
          this.mousePosition = {
            x: this.convertPixelsToRem(event.touches[0].pageX - this.graphPosition.x),
            y: this.convertPixelsToRem(event.touches[0].pageY - this.graphPosition.y),
          };
        } else {
          this.mousePosition = {
            x: this.convertPixelsToRem(event.offsetX - this.graphPosition.x),
            y: this.convertPixelsToRem(event.offsetY - this.graphPosition.y),
          };
          
          let rect = event.target.getBoundingClientRect();

          this.mousePosition.x += this.convertPixelsToRem(rect.x);
          this.mousePosition.y += this.convertPixelsToRem(rect.y);
        }
      },
      addNode(node) {
        const id = uuid();
        const added = {
          id,
          position: {
            x: (this.size.width / 2) - 9 - this.finalPosition.x,
            y: (this.size.height / 2) - 9 - this.finalPosition.y,
          },
          ref: 'node-' + id,
          order: this.nodes.length + 1,
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
        this.$store.commit('addNode', added)
      },
      startConnection(nodeId, outputType, output, position, color) {
        this.setMousePosition(event);
        const id = uuid();
        const node = this.nodes.find(node => node.id == nodeId);
        this.currentWire = {
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
      },
      abortConnection() {
        if (!this.currentWire) {
          return;
        }

        this.$refs[this.nodes.find(node => node.id == this.currentWire.outputNode).ref][0].abort();
        this.currentWire = null;
      },
      hookConnection(nodeId, inputType, input, position) {
        if (!this.currentWire) {
          return;
        }

        if (this.currentWire.outputNode == nodeId || (inputType == 'execOut' && this.currentWire.outputType != 'execIn')) {
          this.abortConnection();
          return;
        }

        this.currentWire.inputNode = nodeId;
        this.currentWire.inputPosition = position;
        this.currentWire.input = input;
        this.currentWire.inputType = inputType;
        this.$store.commit('addWire', this.currentWire);
        this.wires.push(this.currentWire);
        this.abortConnection();
      },
      hookConnectionMobile() {
        if (!this.currentWire || !this.lastTouches) {
          return;
        }
        const element = document.elementFromPoint(this.lastTouches[0].pageX, this.lastTouches[0].pageY);
        if (element) {
          const event = new Event('mouseup', { 'bubbles': true, 'cancelable': true });
          element.dispatchEvent(event);
        }
      },
      deleteConnection(nodeId, type, param) {
        const wire = this.wires.find(wire => wire.inputNode == nodeId && wire.inputType == type && wire.input == param);
        if (!wire) {
          return;
        }
        this.wires = this.wires.filter(item => item.id != wire.id);
        this.$store.commit('removeWire', wire);
      },
      deleteNode(id) {
        const wires = this.wires.filter(wire => wire.inputNode == id || wire.outputNode == id);
        this.wires = this.wires.filter(wire => wire.inputNode != id && wire.outputNode != id);
        this.nodes = this.nodes.filter(node => node.id != id);
        this.$store.commit('removeNode', id);
      },
      calculateStart(wire) {
        let outputNode = this.nodes.find(node => node.id == wire.outputNode);
        return {
          x: outputNode.position.x + (outputNode.ref == this.dragRef ? this.dragPosition.x : 0) + this.convertPixelsToRem(wire.outputPosition.x),
          y: outputNode.position.y + (outputNode.ref == this.dragRef ? this.dragPosition.y : 0) + this.convertPixelsToRem(wire.outputPosition.y),
        };
      },
      calculateEnd(wire) {
        let inputNode = this.nodes.find(node => node.id == wire.inputNode);
        return this.currentWire?.id == wire.id ? {
          x: this.mousePosition.x - this.finalPosition.x,
          y: this.mousePosition.y - this.finalPosition.y,
        } : {
          x: inputNode.position.x + (inputNode.ref == this.dragRef ? this.dragPosition.x : 0) + this.convertPixelsToRem(wire.inputPosition.x),
          y: inputNode.position.y + (inputNode.ref == this.dragRef ? this.dragPosition.y : 0) +  this.convertPixelsToRem(wire.inputPosition.y),
        };
      },
      handleMaximized(nodeId) {
        if (this.playing != 'play') {
          this.player.stop();
          this.playing = null;
        }
        if (nodeId) {
          this.addMenuOpen = false;
          this.maximized = nodeId;
        } else {
          this.maximized = null;
        }
      },
      changeBeats(nodeId, beats) {
        const node = this.nodes.find(node => node.id == nodeId);
        node.beats = beats;
        this.$store.commit('updateNodeBeats', node);
      },
      setLooping(value) {
        this.player.looping = value;
      },
      search(input) {
        const node = this.nodes.find(node => node.name.toLowerCase().includes(input.toLowerCase()));
        if (!node) {
          return;
        }
        this.position.x = -node.position.x + this.size.width / 2 - 9;
        this.position.y = -node.position.y + this.size.height / 2 - 9;
        this.$store.commit('updatePosition', this.finalPosition);
      },
      showTutorial() {
        this.$refs.tutorial.begin();
      },
    },
  };
</script>
