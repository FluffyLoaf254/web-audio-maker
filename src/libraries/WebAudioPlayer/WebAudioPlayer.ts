import { v4 as uuid } from 'uuid';
import { type StateJson, type Node, NodeTrackingInformation, NodeData, isSimpleDataItem, isComplexDataItem } from '../../types';

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
        name: 'Destinatoin',
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
      start: this.calculateStart(node),
      playing: false,
      object: this.createNode(audioContext, node.type, node.data),
      beats: Number(node.beats != null ? node.beats : this.calculateBeats(node)),
      scheduling: false,
    }));

    // connect nodes together
    this.playingNodes.forEach(node => {
      if (!node.object) {
        return;
      }
      for (let output of node.outputs) {
        let input = this.playingNodes.find(input => input.id == output.node);
        if (input.type == 'mix') {
          output = input.outputs[0];
          input = this.playingNodes.find(input => input.id == output.node);
        }
        if (!input.object) {
          continue
        }
        if (output.type == 'inputs') {
          node.object.connect(input.object);
        }
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
      if (!node.object || node.type == 'destination') {
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
          data = Object.assign(data, { [output.input]: this.playingNodes.find(item => item.id == output.node).data.output });
        }
        while (beat < this.scheduleBeats && (this.beat + beat - node.start < node.beats)) {
          if (beat + this.beat >= node.start) {
            for (let param in data) {
              let item = data[param];
              if (isComplexDataItem(item)) {
                const offset = this.beat + beat - node.start;
                const value = item.array.find(value => value.beat - 1 == offset);
                if (!value) {
                  node.object[param].setValueAtTime(0, (((node.start + offset) / this.bpm) * 60) - context.currentTime);
                } else {
                  node.object[param].setValueAtTime(value.value, Math.max(0, ((node.start + offset) / this.bpm) * 60 - context.currentTime));
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

  calculateStart(node: Node) {
    return this.getChainedExecNodes(node).filter(item => item.id != node.id).reduce((carry, node) => carry + Number(node.beats), 0);
  }

  calculateBeats(node: Node) {
    let current = [node];
    while (current.reduce((carry, node) => carry || node.beats, null) == null && current.length != 0) {
      current = this.playingNodes.filter(childNode => current.some(nestedNode => nestedNode.inputs.some(input => input.node == childNode.id)));
    }

    return current.reduce((carry, node) => Math.max(carry, (Number(node.beats ?? 0))), 0);
  }

  getChainedExecNodes(node: Node) {
    let nodes = [node];
    for (let child of node.execIn) {
      const childNode = this.playingNodes.find(childNode => childNode.id == child.node);
      if (childNode) {
        nodes = nodes.concat(this.getChainedExecNodes(childNode));
      }
    }
    
    return nodes;
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
      nodes = nodes.concat(this.getChainedNodes(childNode));
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
      if (isSimpleDataItem(data[param])) {
        options[param] = data[param];
      } else {
        options[param] = 0;
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
