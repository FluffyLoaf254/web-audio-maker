import { createApp, markRaw } from 'vue';
import { createStore } from 'vuex';
import App from './App.vue';
import './style.css';
import OscillatorOptions from './components/OscillatorOptions.vue';
import DelayOptions from './components/DelayOptions.vue';
import GainOptions from './components/GainOptions.vue';
import DestinationOptions from './components/DestinationOptions.vue';
import BiquadFilterOptions from './components/BiquadFilterOptions.vue';

const store = createStore({
  state() {
    return {
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
        },
        {
          type: 'modifier',
          color: 'hsl(60, 70%, 70%)',
          playable: false,
        },
        {
          type: 'destination',
          color: 'hsl(240, 3%, 70%)',
          playable: false,
        },
        {
          type: 'logic',
          color: 'hsl(240, 70%, 70%)',
        },
      ],
      nodes: [
        {
          name: 'Start',
          type: 'start',
          component: null,
          category: 'logic',
          note: 'This logic node must be used to start the execution of the audio graph.',
          inputs: 0,
          outputs: 0,
          audioParams: [],
          execIn: 0,
          execOut: 1,
          max: 1,
          beats: null,
        },
        {
          name: 'Oscillator',
          type: 'oscillator',
          component: markRaw(OscillatorOptions),
          category: 'generator',
          note: 'This node can be used to generate sounds which can be further refined.',
          inputs: 0,
          outputs: 1,
          audioParams: [
            'frequency',
            'detune',
          ],
          execIn: 1,
          execOut: 1,
          max: 10,
          beats: 60,
        },
        {
          name: 'Gain',
          type: 'gain',
          component: markRaw(GainOptions),
          category: 'modifier',
          note: 'Scales the decibel value of the input audio.',
          inputs: 1,
          outputs: 1,
          audioParams: [
            'gain',
          ],
          execIn: 0,
          execOut: 0,
          max: 5,
          beats: null,
        },
        {
          name: 'Delay',
          type: 'delay',
          component: markRaw(DelayOptions),
          category: 'modifier',
          note: 'Applies a delay to the audio.',
          inputs: 1,
          outputs: 1,
          audioParams: [
            'delayTime',
          ],
          execIn: 0,
          execOut: 0,
          max: 5,
          beats: null,
        },
        {
          name: 'Biquad Filter',
          type: 'biquad',
          component: markRaw(BiquadFilterOptions),
          category: 'modifier',
          note: 'Applies a configurable low-order filter to the audio.',
          inputs: 1,
          outputs: 1,
          audioParams: [
            'frequency',
            'detune',
            'Q',
            'gain',
          ],
          execIn: 0,
          execOut: 0,
          max: 3,
          beats: null,
        },
        {
          name: 'Mix',
          type: 'mix',
          component: null,
          category: 'logic',
          note: 'Use this node to combine several outputs into one output.',
          inputs: 2,
          outputs: 1,
          audioParams: [],
          execIn: 0,
          execOut: 0,
          max: 10,
          beats: null,
        },
        {
          name: 'Destination',
          type: 'destination',
          component: markRaw(DestinationOptions),
          category: 'destination',
          note: 'This node represents the audio destination (the speakers).',
          inputs: 1,
          outputs: 0,
          audioParams: [],
          execIn: 0,
          execOut: 0,
          max: 1,
          beats: null,
        },
      ],
    };
  },

  getters: {
    categoryOf(state) {
      return (node) => {
        return state.categories.find(category => category.type == node.category);
      };
    },
    numberOfType(state) {
      return (type) => {
        return state.json.nodes.filter(node => node.type == type).length;
      };
    },
    getNode(state) {
      return (id) => {
        return state.json.nodes.find(node => node.id == id);
      };
    },
    inheritedBeats(state) {
      return (node) => {
        let current = [node];
        while (current.reduce((carry, node) => carry || node.beats, null) == null && current.length != 0) {
          current = state.json.nodes.filter(childNode => current.some(nestedNode => nestedNode.inputs.some(input => input.node == childNode.id)));
        }

        return current.reduce((carry, node) => Math.max(carry, (node.beats ?? 0)), 0);
      }
    },
  },

  mutations: {
    addNode(state, node) {
      state.json.nodes.push({
        id: node.id,
        type: node.type,
        position: node.position,
        beats: node.beats,
        outputs: [],
        inputs: [],
        audioParams: [],
        execIn: [],
        execOut: [],
        data: {},
      });
    },
    removeNode(state, id) {
      state.json.wires = state.json.wires.filter(wire => wire.inputNode != id && wire.outputNode != id);
      state.json.nodes = state.json.nodes.filter(node => node.id != id);
    },
    updateNodePosition(state, node) {
      const index = state.json.nodes.findIndex(stored => stored.id == node.id);
      state.json.nodes[index].position = node.position;
    },
    updateNodeBeats(state, node) {
      const index = state.json.nodes.findIndex(stored => stored.id == node.id);
      state.json.nodes[index].beats = node.beats;
      for (let property in state.json.nodes[index].data) {
        if (Array.isArray(state.json.nodes[index].data[property])) {
          state.json.nodes[index].data[property] = state.json.nodes[index].data[property].filter(item => item.beats <= node.beats);
        }
      }
    },
    updateNodeData(state, { id, data }) {
      const index = state.json.nodes.findIndex(node => node.id == id);
      for (let property in data) {
        if (Array.isArray(data[property])) {
          state.json.nodes[index].data[property] = [];
          state.json.nodes[index].data[property].push(...data[property]);
        } else {
          state.json.nodes[index].data[property] = data[property];
        }
      }
    },
    addWire(state, wire) {
      const outputIndex = state.json.nodes.findIndex(node => node.id == wire.outputNode.id);
      state.json.nodes[outputIndex][wire.outputType].push({
        output: wire.output,
        node: wire.inputNode.id,
        type: wire.inputType,
        param: wire.input,
      });
      const inputIndex = state.json.nodes.findIndex(node => node.id == wire.inputNode.id);
      state.json.nodes[inputIndex][wire.inputType].push({
        input: wire.input,
        node: wire.outputNode.id,
        type: wire.outputType,
        param: wire.output,
      });
      state.json.wires.push({
        id: wire.id,
        outputNode: wire.outputNode.id,
        output: wire.output,
        outputType: wire.outputType,
        inputNode: wire.inputNode.id,
        input: wire.input,
        inputType: wire.inputType,
      });
    },
    removeWire(state, wire) {
      state.json.wires = state.json.wires.filter(item => item.id != wire.id);
      const outputIndex = state.json.nodes.findIndex(node => node.id == wire.outputNode.id);
      state.json.nodes[outputIndex][wire.outputType] = state.json.nodes[outputIndex][wire.outputType].filter(output => !(output.output == wire.output && output.node == wire.inputNode.id && output.type == wire.inputType && output.param == wire.input));
      const inputIndex = state.json.nodes.findIndex(node => node.id == wire.inputNode.id);
      state.json.nodes[inputIndex][wire.inputType] = state.json.nodes[inputIndex][wire.inputType].filter(input => !(input.input == wire.input && input.node == wire.outputNode.id && input.type == wire.outputType && input.param == wire.output));
    },
    updatePosition(state, position) {
      state.json.settings.position = position;
    },
    updateBpm(state, bpm) {
      state.json.settings.bpm = bpm;
    }
  },
})

createApp(App).use(store).mount('#app');
