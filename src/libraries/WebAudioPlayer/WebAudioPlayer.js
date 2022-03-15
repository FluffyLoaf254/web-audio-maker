import { v4 as uuid } from 'uuid';

class WebAudioPlayer {
  constructor(json) {
    this.json = json;
    this.playingNodes = [];
    this.playing = false;
    this.interval = 25;
    this.scheduleBeats = 10;
    this.reachedNodes = [];
    this.reachedExecNodes = [];
    this.beat = 0;
    this.bpm = 120;
  }

  play() {
    const destination = this.json.nodes.find(node => node.type == 'destination');
    if (!destination) {
      return;
    }

    this.playUpTo(destination.id)
  }

  playUpTo(id) {
    let node = this.json.nodes.find(node => node.id == id);
    if (node.type != 'destination') {
      const id = uuid();
      node.outputs.push({
        output: 1,
        node: id,
        type: 'inputs',
        param: 1,
      });
      node = {
        id,
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
            type: 'output',
            param: 1,
          },
        ],
        audioParams: [],
        execIn: [],
        execOut: [],
        beats: 0,
        data: {},
      }
    }
    this.reachedNodes = [];
    const nodes = this.getChainedNodes(node);
    this.playToSpeakers(nodes)
  }

  playNode(id) {
    const node = this.json.nodes.find(node => node.id == id);
    if (node.type != 'oscillator') {
      return;
    }
    const audioContext = new AudioContext;
    node.object = this.createNode(audioContext, node.type, node.data);
    node.object.connect(audioContext.destination);
    node.scheduling = true;
    this.playingNodes = [node];
    this.beat = 0;
    this.schedule(audioContext);
  }

  stop() {
    if (this.playingNodes.length == 0) {
      return;
    }
    this.playingNodes.filter(node => node.started).forEach(node => {
      node.object.stop();
      node.started = false;
    });
    this.playingNodes = [];
    this.playing = false;
  }

  playToSpeakers(nodes) {
    const audioContext = new AudioContext;
    // create audio graph
    nodes = nodes.map(node => {
      node.object = this.createNode(audioContext, node.type, node.data);
      return node;
    });

    // connect nodes together
    nodes.forEach(node => {
      for (let output of node.outputs) {
        const input = nodes.find(input => input.id == output.node);
        if (output.type == 'audioParams') {
          node.object.connect(input.object[output.param]);
        } else if (output.type == 'inputs') {
          node.object.connect(input.object);
        }
      }
    });

    const start = nodes.find(node => node.type == 'start');
    if (!start) {
      return;
    }
    start.scheduling = true;
    this.playingNodes = nodes;
    this.beat = 0;
    this.reachedExecNodes = [];
    this.checkForExecLoop(start);
    this.schedule(audioContext);
  }

  checkForExecLoop(node) {
    this.reachedExecNodes.push(node);
    if (this.reachedExecNodes.filter((item, index) => this.reachedExecNodes.findIndex(node => node.id == item.id) != index).length > 0) {
      throw new Error('Loop detected!');
    }

    for (let child of node.execOut) {
      const childNode = this.json.nodes.find(childNode => childNode.id == child.node);
      this.checkForExecLoop(childNode);
    }
  }

  schedule(context) {
    const scheduling = this.playingNodes.map(node => {
      node.start = node.start || this.calculateBeats(node);
      if (node.start + node.beats > this.beat && node.start <= this.beat + this.scheduleBeats) {
        node.scheduling = true;
      }

      return node;
    }).filter(node => node.scheduling);
    if (scheduling.length == 0) {
      return;
    }
    for (let node of scheduling) {
      if (!node.object) {
        continue;
      }
      if (node.object.start && !node.started) {
        node.object.start((node.start / this.bpm) * 60 - context.currentTime);
        node.started = true;
        this.playing = true;
        node.object.stop(((node.start + node.beats) / this.bpm) * 60 - context.currentTime);
        node.object.onended = () => {
          node.started = false
          if (!this.playingNodes.some(node => node.started)) {
            this.playing = false;
          }
        };
      }
      let nodes = this.getChainedOutputNodes(node);
      for (let node of nodes) {
        let beat = 0;
        while (beat < this.scheduleBeats && (this.beat + beat - node.start < node.beats)) {
          if (beat + this.beat > node.start) {
            for (let param in node.data) {
              if (!Array.isArray(node.data[param])) {
                continue;
              }
              const offset = this.beat + beat - node.start;
              const value = node.data[param].find(value => value.beat - 1 == offset);
              if (!value) {
                continue;
                // node.object[param].setValueAtTime(0, (((node.start + offset) / this.bpm) * 60) - context.currentTime);
              }
              node.object[param].setValueAtTime(value.value, (((node.start + offset) / this.bpm) * 60) - context.currentTime);
            }
          }
          beat++;
        }
      }
    }
    this.beat += this.scheduleBeats;
    setTimeout(() => this.schedule(context), this.interval);
  }

  calculateBeats(node) {
    return this.getChainedExecNodes(node).filter(item => item.id != node.id).reduce((carry, node) => carry + node.beats, 0);
  }

  getChainedExecNodes(node) {
    let nodes = [node];
    for (let child of node.execIn) {
      const childNode = this.playingNodes.find(childNode => childNode.id == child.node);
      if (childNode) {
        nodes = nodes.concat(this.getChainedExecNodes(childNode));
      }
    }
    
    return nodes;
  }

  getChainedOutputNodes(node) {
    let nodes = [node];
    for (let child of node.execOut) {
      const childNode = this.playingNodes.find(childNode => childNode.id == child.node);
      if (childNode && !childNode.scheduling) {
        childNode.start = node.start;
        childNode.scheduling = true;
        nodes = nodes.concat(this.getChainedOutputNodes(childNode));
      }
    }

    return nodes;
  }

  getChainedNodes(node, check = true) {
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
    for (let child of node.audioParams) {
      const childNode = this.json.nodes.find(childNode => childNode.id == child.node);
      nodes = nodes.concat(this.getChainedNodes(childNode));
    }
    for (let child of node.execIn) {
      const childNode = this.json.nodes.find(childNode => childNode.id == child.node);
      nodes = nodes.concat(this.getChainedNodes(childNode, false));
    }
    return nodes;
  }

  createNode(context, type, data) {
    const options = {};
    for (let param in data) {
      if (!Array.isArray(data[param])) {
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
      default:
        return null;
    }
  }
}

export default WebAudioPlayer;
