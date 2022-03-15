<template>
<div class="grid grid-cols-1 h-screen divide-y" style="grid-template-rows: min-content minmax(0, 1fr) min-content;">
  <header-bar @change-bpm="changeBpm">WebAudioMaker</header-bar>
  <div class="flex w-full h-full overflow-hidden md:overflow-visible relative">
    <div class="flex w-full h-full relative ml-0 md:ml-0 transition-all" :class="{ '-ml-64': addMenuOpen }">
      <div class="relative overflow-hidden bg-gradient-to-tr from-purple-500 to-pink-500 w-screen md:w-full h-full" ref="graph" @mousemove="setMousePosition($event)" @touchmove="setMousePosition($event)" @mouseup="abortConnection" @touchend="abortConnection">
        <div class="bg-repeat min-w-full min-h-full" :class="{ 'cursor-grab': !panning, 'cursor-grabbing': panning }" @mousedown.self="startPan($event)" @touchstart.self="startPan($event)" @mouseup.self="endPan" @touchend.self="endPan" @mouseleave="endPan" style="width: 500rem; height: 500rem; background-size: 3rem 3rem; background-image: radial-gradient(circle at center, rgba(255, 255, 255, 0.5) 0, rgba(255, 255, 255, 0.5) 0.5rem, transparent 0.5rem, transparent 3rem); transition: margin-left 0.05s linear, margin-top 0.05s linear;" :style="{ 'margin-left': finalPosition.x + 'rem', 'margin-top': finalPosition.y + 'rem' }">
          <transition-group name="pop">
            <audio-node :node="node" @change-beats="changeBeats" @play-node="playNode" @play-up-to-node="playUpTo" @mousedown="startDrag($event, node)" @touchstart="startDrag($event, node)" @mouseup="endDrag(node)" @touchend="endDrag(node)" @start-connection="startConnection" @hook-connection="hookConnection" @abort-connection="abortConnection" @delete-connection="deleteConnection" @delete-node="deleteNode" @maximized="handleMaximized" v-for="node in nodes" :ref="node.ref" :key="node.id" :style="{ 'z-index': maximized == node.id ? '200' : Math.trunc(100 - (finalPosition.x + finalPosition.y + node.position.x + node.position.y + (node.ref == dragRef ? dragPosition.x + dragPosition.y : 0)) / 10), left: finalPosition.x + node.position.x + (node.ref == dragRef ? dragPosition.x : 0) + 'rem', top: finalPosition.y + node.position.y + (node.ref == dragRef ? dragPosition.y : 0) + 'rem' }" />
          </transition-group>
          <audio-wire :style="{ 'z-index': $refs[wire.outputNode.ref][0].$el.style.zIndex, left: finalPosition.x + 'rem', top: finalPosition.y + 'rem' }" v-for="wire in wires" :key="wire.id" :start="calculateStart(wire)" :end="calculateEnd(wire)" :color="wire.color" />
        </div>
        <add-button class="absolute right-2 bottom-2" @click="addMenuOpen = !addMenuOpen" @mousemove.stop @touchmove.stop />
      </div>
      <add-menu class="absolute h-full -right-64 md:relative md:right-0 md:w-0 md:overflow-hidden transition-all" :class="{ 'md:w-64': addMenuOpen }" @add="addNode" />
    </div>
  </div>
  <footer-bar @play="play" />
</div>
</template>

<script>
  import AddButton from './AddButton.vue';
  import AudioNode from './AudioNode.vue';
  import AudioWire from './AudioWire.vue';
  import HeaderBar from './HeaderBar.vue';
  import FooterBar from './FooterBar.vue';
  import AddMenu from './AddMenu.vue';
  import { v4 as uuid } from 'uuid';
  import { WebAudioPlayer } from '../libraries/WebAudioPlayer';

  export default {
    components: {
      AddButton,
      AudioNode,
      AudioWire,
      HeaderBar,
      FooterBar,
      AddMenu,
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
      };
    },

    mounted() {
      this.setSize();
      window.addEventListener('resize', this.setSize);
      this.player = new WebAudioPlayer(this.$store.state.json);
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
        let current = this.$refs.graph;
        while (current != window.document.body) {
          if (!(current instanceof HTMLElement)) {
            current = current.parentNode;
            continue;
          }
          position.x += current.offsetLeft;
          position.y += current.offsetTop;
          current = current.offsetParent;
        }

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
      changeBpm(value) {
        this.player.bpm = value;
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
        if (event.touches) {
          this.dragStartPosition = {
            x: this.convertPixelsToRem(event.touches[0].pageX - this.graphPosition.x),
            y: this.convertPixelsToRem(event.touches[0].pageY - this.graphPosition.y),
          };
        } else {
          this.dragStartPosition = {
            x: this.convertPixelsToRem(event.offsetX + this.$refs[node.ref][0].$el.offsetLeft),
            y: this.convertPixelsToRem(event.offsetY + this.$refs[node.ref][0].$el.offsetTop),
          };
        }
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
          this.mousePosition = {
            x: this.convertPixelsToRem(event.touches[0].pageX - this.graphPosition.x),
            y: this.convertPixelsToRem(event.touches[0].pageY - this.graphPosition.y),
          };
        } else {
          this.mousePosition = {
            x: this.convertPixelsToRem(event.offsetX),
            y: this.convertPixelsToRem(event.offsetY),
          };
          
          let current = event.target;
          while (current != this.$refs.graph) {
            if (current instanceof SVGElement) {
              const bounds = current.getBoundingClientRect();
              this.mousePosition.x = this.convertPixelsToRem(event.clientX - bounds.left - current.clientLeft);
              this.mousePosition.y = this.convertPixelsToRem(event.clientY - bounds.top - current.clientTop);
              current = current.parentNode;
              continue;
            }
            this.mousePosition.x += this.convertPixelsToRem(current.offsetLeft);
            this.mousePosition.y += this.convertPixelsToRem(current.offsetTop);
            current = current.offsetParent;
          }
        }
      },
      addNode(node) {
        const id = uuid();
        const added = {
          id,
          position: {
            x: (this.size.width / 2) - 8 - this.finalPosition.x,
            y: (this.size.height / 2) - 8 - this.finalPosition.y,
          },
          ref: 'node-' + id,
          categoryObject: this.$store.getters.categoryOf(node),
          ...node,
        };
        this.nodes.push(added);
        this.$store.commit('addNode', added)
      },
      startConnection(nodeId, outputType, output, position, color) {
        const id = uuid();
        const node = this.nodes.find(node => node.id == nodeId);
        this.wires.push({
          id,
          outputNode: node,
          outputPosition: position,
          output,
          outputType,
          inputNode: null,
          inputPosition: null,
          input: null,
          inputType: null,
          color,
        });
        this.currentWire = id;
        this.$refs[node.ref][0].hook(outputType, output);
      },
      abortConnection() {
        if (!this.currentWire) {
          return;
        }

        const wire = this.wires.find(wire => wire.id == this.currentWire);
        this.wires = this.wires.filter(wire => wire.id != this.currentWire);
        this.currentWire = null;
        if (!this.wires.some(item => item.outputType == wire.outputType && item.output == wire.output)) {
          this.$refs[wire.outputNode.ref][0].unhook(wire.outputType, wire.output);
        }
      },
      hookConnection(nodeId, inputType, input, position) {
        if (!this.currentWire) {
          return;
        }
        const wire = this.wires.find(wire => wire.id == this.currentWire);
        if (wire.outputNode.id == nodeId || (wire.outputType == 'execOut' && inputType != 'execIn')) {
          this.abortConnection();
          return;
        }

        wire.inputNode = this.nodes.find(node => node.id == nodeId);
        wire.inputPosition = position;
        wire.input = input;
        wire.inputType = inputType;
        this.currentWire = null;
        this.$refs[wire.inputNode.ref][0].hook(inputType, input);
        this.$store.commit('addWire', wire);
      },
      deleteConnection(nodeId, type, param) {
        const wire = this.wires.find(wire => wire.inputNode.id == nodeId && wire.inputType == type && wire.input == param);
        this.wires = this.wires.filter(item => item.id != wire.id);
        this.$refs[wire.outputNode.ref][0].unhook(wire.outputType, wire.output);
        this.$refs[wire.inputNode.ref][0].unhook(wire.inputType, wire.input);
        this.$store.commit('removeWire', wire);
      },
      deleteNode(id) {
        const wires = this.wires.filter(wire => wire.inputNode.id == id || wire.outputNode.id == id);
        this.wires = this.wires.filter(wire => wire.inputNode.id != id && wire.outputNode.id != id);
        wires.forEach(wire => {
          this.$refs[wire.outputNode.ref][0].unhook(wire.outputType, wire.output);
          this.$refs[wire.inputNode.ref][0].unhook(wire.inputType, wire.input);
        });
        this.nodes = this.nodes.filter(node => node.id != id);
        this.$store.commit('removeNode', id);
      },
      calculateStart(wire) {
        return {
          x: wire.outputNode.position.x + (wire.outputNode.ref == this.dragRef ? this.dragPosition.x : 0) + this.convertPixelsToRem(wire.outputPosition.x),
          y: wire.outputNode.position.y + (wire.outputNode.ref == this.dragRef ? this.dragPosition.y : 0) + this.convertPixelsToRem(wire.outputPosition.y),
        };
      },
      calculateEnd(wire) {
        return this.currentWire == wire.id ? {
          x: this.mousePosition.x - this.finalPosition.x,
          y: this.mousePosition.y - this.finalPosition.y,
        } : {
          x: wire.inputNode.position.x + (wire.inputNode.ref == this.dragRef ? this.dragPosition.x : 0) + this.convertPixelsToRem(wire.inputPosition.x),
          y: wire.inputNode.position.y + (wire.inputNode.ref == this.dragRef ? this.dragPosition.y : 0) +  this.convertPixelsToRem(wire.inputPosition.y),
        };
      },
      handleMaximized(nodeId) {
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
    },
  };
</script>
