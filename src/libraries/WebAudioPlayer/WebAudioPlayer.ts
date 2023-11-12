import { v4 as uuid } from 'uuid';
import { type StateJson, type Node, NodeTrackingInformation, NodeData, isComplexDataItem } from '../../types';

class WebAudioPlayer {
  original: StateJson;
  json: StateJson;
  playingNodes: (Node & NodeTrackingInformation)[];
  playing: boolean;
  scheduleBeats: number;
  reachedNodes: Node[];
  reachedExecNodes: Node[];
  beat: number;
  bpm: number;
  interval: number;
  looping: boolean;
  method: {
    name: string
    param?: string
  };

  constructor(json: StateJson) {
    this.original = json;
    this.playingNodes = [];
    this.playing = false;
    this.scheduleBeats = 100;
    this.reachedNodes = [];
    this.reachedExecNodes = [];
    this.beat = 0;
    this.bpm = 120;
    this.interval = 50;
    this.looping = false;
    this.method = null;
  }

  generateJson() {
    this.json = JSON.parse(JSON.stringify(this.original));
  }

  play() {
    this.method = {
      name: 'play',
    };
    this.generateJson();
    const destination = this.json.nodes.find(node => node.type == 'destination');
    if (!destination) {
      return;
    }

    this.playUpTo(destination.id)
  }

  playUpTo(id: string) {
    this.method = {
      name: 'playUpTo',
      param: id,
    };
    this.generateJson();
    let node = this.json.nodes.find(node => node.id == id);
    if (node.type != 'destination') {
      const id = uuid();
      node.execOut = [];
      node.outputs = [{
        output: 1,
        node: id,
        type: 'inputs',
        param: 1,
      }];
      node = {
        id,
        name: 'Destination',
        ref: 'generated',
        type: 'destination',
        position: {
          x: 0,
          y: 0,
        },
        outputs: [],
        inputs: [
          {
            input: 1,
            node: node.id,
            type: 'outputs',
            param: 1,
          },
        ],
        audioParamInputs: [],
        audioParamOutputs: [],
        execIn: [],
        execOut: [],
        beats: 0,
        data: {},
        meta: {},
        order: 0,
      };
      this.json.nodes.push(node);
    }
    this.playToSpeakers(this.json.nodes);
  }

  playNode(id: string) {
    this.method = {
      name: 'playNode',
      param: id,
    };
    this.generateJson();
    const node = this.json.nodes.find(node => node.id == id);
    const audioContext = new AudioContext;
    const playingNode: Node & NodeTrackingInformation = Object.assign({}, node, {
      start: 0,
      playing: false,
      object: this.createNode(audioContext, node.type, node.data),
      scheduling: true,
    });
    playingNode.object.connect(audioContext.destination);
    this.playingNodes = [playingNode];
    this.beat = 0;
    this.playing = true;
    this.schedule(audioContext);
  }

  stop() {
    if (this.playingNodes.length == 0) {
      return;
    }
    this.playingNodes.filter(node => node.playing).forEach(node => {
      if (node.object instanceof AudioScheduledSourceNode) {
        node.object.stop();
        node.playing = false;
      }
    });
    this.playingNodes = [];
    this.playing = false;
  }

  playToSpeakers(nodes) {
    const audioContext = new AudioContext;

    let compiledNodes = JSON.parse(JSON.stringify(nodes));

    // handle loops
    compiledNodes = this.compileLoopNodes(compiledNodes);
    
    // handle mix nodes
    compiledNodes = this.compileMixNodes(compiledNodes);

    this.playingNodes = compiledNodes.map((node: Node): Node & NodeTrackingInformation => Object.assign({}, node, {
      start: this.calculateStart(compiledNodes, node),
      playing: false,
      object: this.createNode(audioContext, node.type, node.data),
      beats: node.beats || this.calculateBeats(compiledNodes, node),
      scheduling: false,
    }));

    // handle inherited start timing
    this.playingNodes.filter(node => node.start == null).forEach(node => {
      node.start = this.calculateStartFromInputs(this.playingNodes, node);
    });

    // connect nodes together
    this.playingNodes.forEach(node => {
      if (!node.object) {
        return;
      }
      for (let output of node.outputs) {
        let outputNode = this.playingNodes.find(input => input.id == output.node);
        if (!outputNode) {
          continue;
        }
        if (!outputNode.object) {
          continue
        }
        node.object.connect(outputNode.object);
      }
    });

    const start = this.playingNodes.find(node => node.type == 'start');
    if (!start) {
      return;
    }
    start.scheduling = true;
    this.beat = 0;
    this.playing = true;
    this.reachedExecNodes = [];
    this.checkForExecLoop(start);
    this.schedule(audioContext);
  }

  compileLoopNodes(nodes: Node[]): Node[] {
    let loops = nodes.filter(node => node.type == 'loop');
    for (let index = 0; index < loops.length; index++) {
      let loop = loops[index];
      let iterations = (loops[index].meta.iterations ?? 2);
      // handle no iterations
      if (iterations == 0) {
        if (loops[index].execOut[1]) {
          let execOutNode = nodes.find(item => item.id == loops[index].execOut[0].node);
          if (execOutNode) {
            execOutNode.execIn = execOutNode.execIn.filter(input => input.node != loops[index].id);
          }
          loops[index].execOut[0] = loops[index].execOut[1];
          loops[index].execOut.splice(1, 1);
        }
        continue;
      }

      for (let iteration = 1; iteration <= iterations - 1; iteration++) {
        nodes = this.compileLoopNode(nodes, loop, iteration);
        loop = nodes.find(node => node.id == loop.id.slice(0, 36) + iteration.toString());
        loop.execOut.splice(1, 1);
      }
      if (loops[index].execOut[1]) {   
        if (!loops[index].execOut[0]) {
          loops[index].execOut[0] = loops[index].execOut[1];
        } else {
          let execOutNode = nodes.find(item => item.id == loops[index].execOut[0].node);
          let chained = this.getAllChainedOutputNodes(nodes, execOutNode);
          let lastNode = this.getLastChainedExecOutNode(chained, execOutNode);
          lastNode.execOut[0] = { ...loops[index].execOut[1] };
          let inputNode = nodes.find(item => item.id == loops[index].execOut[1].node);
          inputNode.execIn[0].node = lastNode.id;
        }
        loops[index].execOut.splice(1, 1);
      }
    }

    return nodes;
  }

  compileLoopNode(nodes: Node[], node: Node, iteration: number): Node[] {
    let execOutNode = nodes.find(item => item.id == node.execOut[0].node);
    if (!execOutNode) {
      return nodes;
    }
    let copy = JSON.parse(JSON.stringify(node));
    copy.id = copy.id.slice(0, 36) + iteration.toString();
    copy.execOut[0].node = copy.execOut[0].node.slice(0, 36) + iteration.toString();
    if (copy.execOut[1]) {
      copy.execOut.splice(1, 1);
    }
    let chainedOriginal = this.getAllChainedOutputNodes(nodes, execOutNode);
    let chainedCopy = JSON.parse(JSON.stringify(chainedOriginal));
    chainedCopy.forEach(item => {
      item.id = item.id.slice(0, 36) + iteration.toString();
      item.execIn.forEach(input => input.node = input.node.slice(0, 36) + iteration.toString());
      item.execOut.forEach(output => output.node = output.node.slice(0, 36) + iteration.toString());
      item.inputs.forEach(input => input.node = input.node.slice(0, 36) + iteration.toString());
    });
    let lastOriginal = this.getLastChainedExecOutNode(chainedOriginal, execOutNode);
    copy.execIn[0].node = lastOriginal.id;
    lastOriginal.execOut[0] = { 
      output: 1,
      node: copy.id,
      type: 'execIn',
      param: 1,
    };
    for (let item of chainedCopy) {
      // duplicate audio parameters
      for (let audioParamInput of item.audioParamInputs) {
        let audioParamInputNode = nodes.find(item => item.id == audioParamInput.node);
        if (!audioParamInputNode) {
          continue;
        }
        audioParamInput.node = audioParamInput.node.slice(0, 36) + iteration.toString();
        let extraNode = JSON.parse(JSON.stringify(audioParamInputNode));
        extraNode.id = extraNode.id.slice(0, 36) + iteration.toString();
        extraNode.audioParamOutputs.forEach(output => output.node = output.node.slice(0, 36) + iteration.toString());
        nodes.push(extraNode);
      }
      // if we have an internal output, update it
      for (let output of item.outputs) {
        let outputNode = chainedCopy.find(item => item.id == output.node.slice(0, 36) + iteration.toString());
        if (!outputNode) {
          continue;
        }
        output.node = output.node.slice(0, 36) + iteration.toString();
      }
      // if we have an internal input, update it
      for (let input of item.inputs) {
        let inputNode = chainedCopy.find(item => item.id == input.node.slice(0, 36) + iteration.toString());
        if (!inputNode) {
          continue;
        }
        input.node = input.node.slice(0, 36) + iteration.toString();
      }
    }
    nodes.push(copy);
    nodes = nodes.concat(chainedCopy);

    return nodes;
  }

  compileMixNodes(nodes: Node[]): Node[] {
    let mixes = nodes.filter(node => node.type == 'mix');
    for (let index = 0; index < mixes.length; index++) {
      nodes = this.compileMixNode(nodes, mixes[index]);
    }

    return nodes;
  }

  compileMixNode(nodes: Node[], node: Node): Node[] {
    if (!node) {
      return nodes;
    }
    
    for (let input of node.inputs) {
      let inputNode = nodes.find(item => item.id == input.node);
      if (!inputNode) {
        continue;
      }
      inputNode.outputs = inputNode.outputs.filter(output => output.node != node.id);
      inputNode.outputs = inputNode.outputs.concat(node.outputs);
    }

    for (let output of node.outputs) {
      let outputNode = nodes.find(item => item.id == output.node);
      if (!outputNode) {
        continue;
      }
      outputNode.inputs = outputNode.inputs.filter(input => input.node != node.id);
      outputNode.inputs = outputNode.inputs.concat(node.inputs);
    }

    return nodes.filter(item => item.id != node.id);
  }

  calculateStartFromInputs(nodes: (Node & NodeTrackingInformation)[], node: Node & NodeTrackingInformation) {
    let start = node.start;
    for (let child of node.inputs) {
      const childNode = nodes.find(childNode => childNode.id == child.node);
      start = start || this.calculateStartFromInputs(nodes, childNode);
    }
    return start;
  }

  checkForExecLoop(node: Node) {
    this.reachedExecNodes.push(node);
    if (this.reachedExecNodes.filter((item, index) => this.reachedExecNodes.findIndex(node => node.id == item.id) != index).length > 0) {
      throw new Error('Loop detected!');
    }

    for (let child of node.execOut) {
      const childNode = this.json.nodes.find(childNode => childNode.id == child.node);
      this.checkForExecLoop(childNode);
    }
  }

  calculateStart(nodes: Node[], node: Node) {
    let execNodes = this.getChainedExecInNodes(nodes, node).filter(item => item.id != node.id);
    return execNodes.length ? execNodes.reduce((carry, node) => carry + Number(node.beats), 0) : null;
  }

  calculateBeats(nodes: Node[], node: Node) {
    let current = [node];
    while (current.reduce((carry, node) => carry || node.beats, null) == null && current.length != 0) {
      current = nodes.filter(childNode => current.some(nestedNode => nestedNode.inputs.some(input => input.node == childNode.id)));
    }

    return current.reduce((carry, node) => Math.max(carry, (Number(node.beats ?? 0))), 0);
  }

  getAllChainedOutputNodes(nodes: Node[], node: Node): Node[] {
    this.reachedNodes = [];
    return this.getUnreachedChainedOutputNodes(nodes, node);
  }

  getUnreachedChainedOutputNodes(nodes: Node[], node: Node): Node[] {
    this.reachedNodes.push(node);
    if (node.type == 'destination' || this.reachedNodes.filter((item, index) => this.reachedNodes.findIndex(node => node.id == item.id) != index).length > 0) {
      return [];
    }
    let outputNodes = [node];
    for (let child of node.outputs) {
      const childNode = nodes.find(childNode => childNode.id == child.node);
      outputNodes = outputNodes.concat(this.getAllChainedOutputNodes(nodes, childNode));
    }
    for (let child of node.execOut) {
      const childNode = nodes.find(childNode => childNode.id == child.node);
      outputNodes = outputNodes.concat(this.getAllChainedOutputNodes(nodes, childNode));
    }
    return outputNodes;
  }

  getLastChainedExecOutNode(nodes: Node[], start: Node): Node {
    return this.getLastChainedExecOutNodeWithBeats(nodes, start, 0)[1];
  }

  getLastChainedExecOutNodeWithBeats(nodes: Node[], start: Node, beats: number = 0): [number, Node] {
    let node = start;
    beats += node.beats;
    for (let child of start.execOut) {
      const childNode = nodes.find(childNode => childNode.id == child.node);
      if (childNode) {
        let [childBeats, highestChildNode] = this.getLastChainedExecOutNodeWithBeats(nodes, childNode, beats);
        if (childBeats > beats) {
          beats = childBeats;
          node = highestChildNode;
        }
      }
    }
    
    return [beats, node];
  }

  getChainedExecInNodes(nodes: Node[], node: Node) {
    let execNodes = [node];
    for (let child of node.execIn) {
      const childNode = nodes.find(childNode => childNode.id == child.node);
      if (childNode) {
        execNodes = execNodes.concat(this.getChainedExecInNodes(nodes, childNode));
      }
    }
    
    return execNodes;
  }

  getChainedOutputNodes(node: Node & NodeTrackingInformation) {
    let nodes = [node];
    for (let child of node.outputs) {
      const childNode = this.playingNodes.find(childNode => childNode.id == child.node);
      if (childNode && !childNode.scheduling) {
        childNode.start = node.start;
        childNode.scheduling = true;
        nodes = nodes.concat(this.getChainedOutputNodes(childNode));
      }
    }

    return nodes;
  }

  getAllChainedInputNodes(node: Node) {
    this.reachedNodes.push(node);
    if (this.reachedNodes.filter((item, index) => this.reachedNodes.findIndex(node => node.id == item.id) != index).length > 0) {
      return [];
    }
    let nodes = [node];
    for (let child of node.inputs) {
      const childNode = this.json.nodes.find(childNode => childNode.id == child.node);
      nodes = nodes.concat(this.getAllChainedInputNodes(childNode));
    }
    for (let child of node.audioParamInputs) {
      const childNode = this.json.nodes.find(childNode => childNode.id == child.node);
      nodes = nodes.concat(this.getAllChainedInputNodes(childNode));
    }
    for (let child of node.execIn) {
      const childNode = this.json.nodes.find(childNode => childNode.id == child.node);
      nodes = nodes.concat(this.getAllChainedInputNodes(childNode));
    }
    return nodes;
  }

  schedule(context: AudioContext) {
    if (!this.playing) {
      return
    }
    const scheduling = this.playingNodes.map(node => {
      node.scheduling = (node.start + node.beats > this.beat && node.start < this.beat + this.scheduleBeats);
      
      return node;
    }).filter(node => node.scheduling);
    if (scheduling.length == 0) {
      return;
    }
    for (let node of scheduling) {
      if (node.start == null || !node.object || node.type == 'destination') {
        continue;
      }

      if (node.object instanceof AudioScheduledSourceNode && !node.playing) {
        node.object.start(Math.max(0, (node.start / this.bpm) * 60 - context.currentTime));
        node.playing = true;
        node.object.stop(Math.max(0, ((node.start + node.beats) / this.bpm) * 60 - context.currentTime));
        node.object.onended = () => {
          node.playing = false;
          if (!this.playingNodes.some(node => node.playing)) {
            if (this.playing && this.looping) {
              this[this.method.name](this.method.param);
            } else {
              this.playing = false;
            }
          }
        };
      }

      let nodes = this.getChainedOutputNodes(node);
      for (let node of nodes) {
        let beat = 0;
        let data = node.data;
        // handle audio param nodes (forwards data properties)
        for (let output of node.audioParamInputs) {
          let outputNode = this.playingNodes.find(item => item.id == output.node);
          data = Object.assign(data, { [output.input]: outputNode.data[outputNode.audioParamOutputs.find(param => param.output == output.param).output] });
        }
        while (beat < this.scheduleBeats && (this.beat + beat - node.start < node.beats)) {
          if (beat + this.beat >= node.start) {
            for (let param in data) {
              let item = data[param];
              if (isComplexDataItem(item)) {
                const offset = this.beat + beat - node.start;
                const values = item.array.filter(value => Math.floor(value.beat - 1) <= offset);
                if (!values.length) {
                  continue;
                }
                for (let value of values) {
                  switch (value.transition) {
                    case 'constant':
                      node.object[param].setValueAtTime(value.value, Math.max(0, ((node.start + value.beat - 1) / this.bpm) * 60 - context.currentTime));
                      break;
                    case 'linear':
                      node.object[param].linearRampToValueAtTime(Math.max(value.value, 0.0001), Math.max(0, ((node.start + value.beat - 1) / this.bpm) * 60 - context.currentTime));
                      break;
                    case 'exponential':
                      node.object[param].exponentialRampToValueAtTime(Math.max(value.value, 0.0001), Math.max(0, ((node.start + value.beat - 1) / this.bpm) * 60 - context.currentTime));
                      break;
                  }
                }
              } else {
                if (Boolean(node.object[param].value)) {
                  node.object[param].value = (item || 0);
                }
                continue;
              }
            }
          }
          beat++;
        }
      }
    }
    this.beat += this.scheduleBeats;
    setTimeout(() => this.schedule(context), this.interval);
  }

  createNode(context: AudioContext, type: string, data: NodeData) {
    const options = {};
    for (let param in data) {
      let item = data[param];
      if (isComplexDataItem(item)) {
        options[param] = item.start;
      } else {
        options[param] = item;
      }
    }
    switch (type) {
      case 'destination':
        return context.destination;
      case 'gain':
        return new GainNode(context, options);
      case 'oscillator':
        return new OscillatorNode(context, options);
      case 'delay':
        return new DelayNode(context, options);
      case 'biquad':
        return new BiquadFilterNode(context, options);
      default:
        return null;
    }
  }
}

export default WebAudioPlayer;
