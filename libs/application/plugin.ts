import { Component } from '../core';

interface Plugin {
  name: string;
  components?: Component[];
  init?(instance: any): Promise<void>;
  build?(instance: any): Promise<void>;
}

export { Plugin };
