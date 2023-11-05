import { ComponentPublicInstance } from 'vue';

export interface StateJson {
  nodes: Node[]
  wires: Wire[]
  settings: {
    bpm: number
    position: {
      x: number
      y: number
    }
    looping: boolean
  }
}

export type OutputType = 'outputs' | 'audioParamOutputs' | 'execOut';

export type InputType = 'inputs' | 'audioParamInputs' | 'execIn';

export interface Position {
  x: number
  y: number
};

export interface Input {
  input: string | number
  node: string
  type: OutputType
  param: string | number
};

export interface Output {
  output: string | number
  node: string
  type: InputType
  param: string | number
};

export interface NodeData {
  [index: string]: SimpleDataItem | ComplexDataItem
};

export type SimpleDataItem = string | number;

export interface ComplexDataItem {
  start: number
  values: number
  algorithm: string
  array: Beat[]
};

export interface Beat {
  value: number
  index: number
  beat: number
};

export interface Node {
  id: string
  position: Position
  ref: string
  order: number
  outputs: Output[]
  inputs: Input[]
  audioParamOutputs: Output[]
  audioParamInputs: Input[]
  execOut: Output[]
  execIn: Input[]
  data: NodeData
  beats: number | null
  type: string
};

export interface Wire {
  id: string
  outputNode: string
  outputPosition: Position
  output: string | number
  outputType: OutputType
  inputNode: string
  inputPosition: Position
  input: string | number
  inputType: InputType
  color: string
};

export interface NodeType {
  name: string
  type: string
  component: ComponentPublicInstance | null
  category: string
  note: string
  numberOfInputs: number
  numberOfOutputs: number
  audioParams: string[]
  numberOfAudioParamOutputs: number
  numberOfExecIn: number
  numberOfExecOut: number
  max: number
  beats: number | null
};

export interface NodeTypeCategory {
  type: string
  color: string
  playable: boolean
};

export function isComplexDataItem(dataItem: SimpleDataItem | ComplexDataItem): dataItem is ComplexDataItem
{
  return typeof dataItem == 'object' ? Array.isArray(dataItem.array) : false;
}

export function isSimpleDataItem(dataItem: SimpleDataItem | ComplexDataItem): dataItem is SimpleDataItem
{
  return typeof dataItem != 'object';
}
