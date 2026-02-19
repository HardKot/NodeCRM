import { Component } from '../core';
import { IInstance } from './instance';

interface Plugin {
  name: string;
  components?: Component[];
  init?(instance: IInstance): Promise<void>;
  build?(instance: IInstance): Promise<void>;
}

export { Plugin };
