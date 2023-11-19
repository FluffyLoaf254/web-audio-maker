import { markRaw } from 'vue';
import { defineStore } from 'pinia';
import { type Node, type Wire, type StateJson, type NodeTypeCategory, type NodeType, type Position, type NodeData, isComplexDataItem } from '../types';
import AudioParamOptions from '../components/AudioParamOptions.vue';
import BiquadFilterOptions from '../components/BiquadFilterOptions.vue';
import DelayOptions from '../components/DelayOptions.vue';
import DestinationOptions from '../components/DestinationOptions.vue';
import GainOptions from '../components/GainOptions.vue';
import OscillatorOptions from '../components/OscillatorOptions.vue';
import KeyboardOptions from '../components/KeyboardOptions.vue';
import BeatsInput from '../components/BeatsInput.vue';
import IterationsInput from '../components/IterationsInput.vue';

export interface State {
  json: StateJson
  categories: NodeTypeCategory[]
  nodeTypes: NodeType[]
};

export const useGraphStore = defineStore('graph', {
  state: (): State => ({
    json: {
      nodes: [],
      wires: [],
      settings: {
        bpm: 120,
        position: {
          x: -250,
          y: -250,
        },
        looping: false,
      },
    },
    categories: [
      {
        type: 'generator',
        color: 'hsl(120, 70%, 70%)',
        playable: true,
        playableUpTo: true,
      },
      {
        type: 'modifier',
        color: 'hsl(60, 70%, 70%)',
        playable: false,
        playableUpTo: true,
      },
      {
        type: 'destination',
        color: 'hsl(240, 3%, 70%)',
        playable: false,
        playableUpTo: true,
      },
      {
        type: 'logic',
        color: 'hsl(240, 70%, 70%)',
        playable: false,
        playableUpTo: false,
      },
      {
        type: 'driver',
        color: 'hsl(0, 70%, 70%)',
        playable: false,
        playableUpTo: false,
      },
    ],
    nodeTypes: [
      {
        name: 'Start',
        type: 'start',
        component: null,
        extraComponent: null,
        category: 'logic',
        note: 'This logic node must be used to start the execution of the audio graph.',
        numberOfInputs: 0,
        numberOfOutputs: 0,
        namesOfAudioParamInputs: [],
        namesOfAudioParamOutputs: [],
        numberOfExecIn: 0,
        numberOfExecOut: 1,
        max: 1,
        beats: null,
      },
      {
        name: 'Oscillator',
        type: 'oscillator',
        component: markRaw(OscillatorOptions),
        extraComponent: markRaw(BeatsInput),
        category: 'generator',
        note: 'This node can be used to generate sounds which can be further refined.',
        numberOfInputs: 0,
        numberOfOutputs: 1,
        namesOfAudioParamInputs: [
          'frequency',
          'detune',
        ],
        namesOfAudioParamOutputs: [],
        numberOfExecIn: 1,
        numberOfExecOut: 1,
        max: 10,
        beats: 60,
      },
      {
        name: 'Gain',
        type: 'gain',
        component: markRaw(GainOptions),
        extraComponent: null,
        category: 'modifier',
        note: 'Scales the decibel value of the input audio.',
        numberOfInputs: 1,
        numberOfOutputs: 1,
        namesOfAudioParamInputs: [
          'gain',
        ],
        namesOfAudioParamOutputs: [],
        numberOfExecIn: 0,
        numberOfExecOut: 0,
        max: 5,
        beats: null,
      },
      {
        name: 'Delay',
        type: 'delay',
        component: markRaw(DelayOptions),
        extraComponent: null,
        category: 'modifier',
        note: 'Applies a delay to the audio.',
        numberOfInputs: 1,
        numberOfOutputs: 1,
        namesOfAudioParamInputs: [
          'delayTime',
        ],
        namesOfAudioParamOutputs: [],
        numberOfExecIn: 0,
        numberOfExecOut: 0,
        max: 5,
        beats: null,
      },
      {
        name: 'Biquad Filter',
        type: 'biquad',
        component: markRaw(BiquadFilterOptions),
        extraComponent: null,
        category: 'modifier',
        note: 'Applies a configurable low-order filter to the audio.',
        numberOfInputs: 1,
        numberOfOutputs: 1,
        namesOfAudioParamInputs: [
          'frequency',
          'detune',
          'Q',
          'gain',
        ],
        namesOfAudioParamOutputs: [],
        numberOfExecIn: 0,
        numberOfExecOut: 0,
        max: 3,
        beats: null,
      },
      {
        name: 'Keyboard',
        type: 'keyboard',
        component: markRaw(KeyboardOptions),
        extraComponent: markRaw(BeatsInput),
        category: 'driver',
        note: 'Drive nodes with an intuitive keyboard control.',
        numberOfInputs: 0,
        numberOfOutputs: 0,
        namesOfAudioParamInputs: [],
        namesOfAudioParamOutputs: [
          'frequency',
          'gain',
        ],
        numberOfExecIn: 0,
        numberOfExecOut: 0,
        max: 10,
        beats: 60,
      },
      {
        name: 'Audio Param',
        type: 'param',
        component: markRaw(AudioParamOptions),
        extraComponent: markRaw(BeatsInput),
        category: 'driver',
        note: 'This node is for driving audio params from one spot.',
        numberOfInputs: 0,
        numberOfOutputs: 0,
        namesOfAudioParamInputs: [],
        namesOfAudioParamOutputs: [
          'output',
        ],
        numberOfExecIn: 0,
        numberOfExecOut: 0,
        max: 10,
        beats: 60,
      },
      {
        name: 'Mix',
        type: 'mix',
        component: null,
        extraComponent: null,
        category: 'logic',
        note: 'Use this node to combine several outputs into one output.',
        numberOfInputs: 2,
        numberOfOutputs: 1,
        namesOfAudioParamInputs: [],
        namesOfAudioParamOutputs: [],
        numberOfExecIn: 0,
        numberOfExecOut: 0,
        max: 10,
        beats: null,
      },
      {
        name: 'Loop',
        type: 'loop',
        component: null,
        extraComponent: markRaw(IterationsInput),
        category: 'logic',
        note: 'Use this node to loop over a section of the graph.',
        numberOfInputs: 0,
        numberOfOutputs: 0,
        namesOfAudioParamInputs: [],
        namesOfAudioParamOutputs: [],
        numberOfExecIn: 1,
        numberOfExecOut: 2,
        max: 10,
        beats: null,
      },
      {
        name: 'Destination',
        type: 'destination',
        component: markRaw(DestinationOptions),
        extraComponent: null,
        category: 'destination',
        note: 'This node represents the audio destination (the speakers).',
        numberOfInputs: 1,
        numberOfOutputs: 0,
        namesOfAudioParamInputs: [],
        namesOfAudioParamOutputs: [],
        numberOfExecIn: 0,
        numberOfExecOut: 0,
        max: 1,
        beats: null,
      },
    ],
  }),
  
  getters: {
    categoryOf(state: State) {
      return (type: NodeType) => {
        return state.categories.find(category => category.type == type.category);
      };
    },
    typeOf(state: State) {
      return (node: Node) => {
        return state.nodeTypes.find(item => item.type == node.type);
      }
    },
    numberOfType(state: State) {
      return (type: string) => {
        return state.json.nodes.filter(node => node.type == type).length;
      };
    },
    getNode(state: State) {
      return (id: string) => {
        return state.json.nodes.find(node => node.id == id);
      };
    },
    inheritedBeats(state: State) {
      return (node: Node) => {
        let current = [node];
        while (current.reduce<number | null>((carry, node) => carry || node.beats, null) == null && current.length != 0) {
          current = state.json.nodes.filter(childNode => current.some(nestedNode => nestedNode.inputs.some(input => input.node == childNode.id)));
        }
        
        return current.reduce((carry, node) => Math.max(carry, (node.beats ?? 0)), 0);
      }
    },
  },

  actions: {
    load(json: StateJson) {
      this.json = json;
    },
    addNode(node: Node) {
      this.json.nodes.push(node);
    },
    removeNode(id: string) {
      this.json.wires
        .filter(wire => wire.inputNode == id || wire.outputNode == id)
        .forEach(wire => this.removeWire(wire));
      this.json.nodes = this.json.nodes.filter(node => node.id != id);
    },
    updateNodePosition({ id, position }: { id: string, position: Position }) {
      const index = this.json.nodes.findIndex(node => node.id == id);
      this.json.nodes[index].position = position;
    },
    updateNodeBeats({ id, beats }: { id: string, beats: number }) {
      const index = this.json.nodes.findIndex(node => node.id == id);
      this.json.nodes[index].beats = beats;
      for (let property in this.json.nodes[index].data) {
        let data = this.json.nodes[index].data[property];
        if (isComplexDataItem(data)) {
          data.array = data.array.filter(item => item.beat <= beats);
        }
      }
    },
    updateNodeOrder({ id, order }: { id: string, order: number }) {
      const index = this.json.nodes.findIndex(node => node.id == id);
      this.json.nodes[index].order = order;
    },
    updateNodeData({ id, data }: { id: string, data: NodeData }) {
      const index = this.json.nodes.findIndex(node => node.id == id);
      for (let property in data) {
        this.json.nodes[index].data[property] = data[property];
      }
    },
    updateNodeMeta({ id, meta }: { id: string, meta: any }) {
      const index = this.json.nodes.findIndex(node => node.id == id);
      for (let property in meta) {
        this.json.nodes[index].meta[property] = meta[property];
      }
    },
    addWire(wire: Wire) {
      const outputIndex = this.json.nodes.findIndex(node => node.id == wire.outputNode);
      this.json.nodes[outputIndex][wire.outputType].push({
        output: wire.output,
        node: wire.inputNode,
        type: wire.inputType,
        param: wire.input,
      });
      const inputIndex = this.json.nodes.findIndex(node => node.id == wire.inputNode);
      this.json.nodes[inputIndex][wire.inputType].push({
        input: wire.input,
        node: wire.outputNode,
        type: wire.outputType,
        param: wire.output,
      });
      this.json.wires.push(wire);
    },
    removeWire(wire: Wire) {
      this.json.wires = this.json.wires.filter(item => item.id != wire.id);
      const outputIndex = this.json.nodes.findIndex(node => node.id == wire.outputNode);
      this.json.nodes[outputIndex][wire.outputType] = this.json.nodes[outputIndex][wire.outputType].filter(output => !(output.output == wire.output && output.node == wire.inputNode && output.type == wire.inputType && output.param == wire.input));
      const inputIndex = this.json.nodes.findIndex(node => node.id == wire.inputNode);
      this.json.nodes[inputIndex][wire.inputType] = this.json.nodes[inputIndex][wire.inputType].filter(input => !(input.input == wire.input && input.node == wire.outputNode && input.type == wire.outputType && input.param == wire.output));
    },
    updatePosition(position: Position) {
      this.json.settings.position = position;
    },
    updateBpm(bpm: number) {
      this.json.settings.bpm = bpm;
    },
    updateLooping(looping: boolean) {
      this.json.settings.looping = looping;
    },
  },
});
