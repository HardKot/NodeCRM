import { Component } from '../component';

interface Plugins {
  name: string;
  components?: Component[];
  init?(instance: any): Promise<void>;
  build?(instance: any): Promise<void>;
}

export { Plugins };
