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
      }
    }
    this.reachedNodes = [];
    const nodes = this.getChainedNodes(node);
    this.playToSpeakers(nodes)
  }

  playNode(id: string) {
    this.method = {
      name: 'playNode',
      param: id,
    };
    this.generateJson();
    const node = this.json.nodes.find(node => node.id == id);
    if (node.type != 'oscillator') {
      return;
    }
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
    this.playingNodes = nodes.map((node: Node): Node & NodeTrackingInformation => Object.assign({}, node, {
      start: this.calculateStart(nodes, node),
      playing: false,
      object: this.createNode(audioContext, node.type, node.data),
      beats: node.beats || this.calculateBeats(nodes, node),
      scheduling: false,
    }));

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
        if (outputNode.type == 'mix') {
          output = outputNode.outputs[0];
          outputNode = this.playingNodes.find(input => input.id == output.node);
        }
        if (!outputNode.object) {
          continue
        }
        node.object.connect(outputNode.object);
      }
    });

    // handle inherited start timing
    this.playingNodes = this.playingNodes.map(node => {
      if (node.start == null) {
        node.start = this.calculateStartFromInputs(this.playingNodes, node);
      }

      return node;
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

  calculateStartFromInputs(nodes: (Node & NodeTrackingInformation)[], node: Node & NodeTrackingInformation) {
    let start = node.start;
    for (let child of node.inputs) {
      const childNode = this.playingNodes.find(childNode => childNode.id == child.node);
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
          data = Object.assign(data, { [output.input]: outputNode.data[outputNode.audioParamOutputs.find(param => param.output == output.param).param] });
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

  calculateStart(nodes: Node[], node: Node) {
    let execNodes = this.getChainedExecNodes(nodes, node).filter(item => item.id != node.id);
    return execNodes.length ? execNodes.reduce((carry, node) => carry + Number(node.beats), 0) : null;
  }

  calculateBeats(nodes: Node[], node: Node) {
    let current = [node];
    while (current.reduce((carry, node) => carry || node.beats, null) == null && current.length != 0) {
      current = nodes.filter(childNode => current.some(nestedNode => nestedNode.inputs.some(input => input.node == childNode.id)));
    }

    return current.reduce((carry, node) => Math.max(carry, (Number(node.beats ?? 0))), 0);
  }

  getChainedExecNodes(nodes: Node[], node: Node) {
    let execNodes = [node];
    for (let child of node.execIn) {
      const childNode = nodes.find(childNode => childNode.id == child.node);
      if (childNode) {
        execNodes = execNodes.concat(this.getChainedExecNodes(nodes, childNode));
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

  getChainedNodes(node: Node, check: boolean = true) {
    if (check) {
      this.reachedNodes.push(node);
      if (this.reachedNodes.filter((item, index) => this.reachedNodes.findIndex(node => node.id == item.id) != index).length > 0) {
        throw new Error('Loop detected!');
      }
    }
    let nodes = [node];
    for (let child of node.inputs) {
      const childNode = this.json.nodes.find(childNode => childNode.id == child.node);
      nodes = nodes.concat(this.getChainedNodes(childNode));
    }
    for (let child of node.audioParamInputs) {
      const childNode = this.json.nodes.find(childNode => childNode.id == child.node);
      nodes = nodes.concat(this.getChainedNodes(childNode, false));
    }
    for (let child of node.execIn) {
      const childNode = this.json.nodes.find(childNode => childNode.id == child.node);
      nodes = nodes.concat(this.getChainedNodes(childNode, false));
    }
    return nodes;
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
