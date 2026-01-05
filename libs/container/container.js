import { Space } from './space.js';
import { Graph } from './graph.js';
import { ParserModule } from './parserModule.js';

class ContainerError extends Error { }

class Container {
  constructor(config) {
    this.space = new Space({
      slices: config.slices,
      root: config.root,
      context: config.context,
      logger: config.logger,
      alias: config.alias,

      watchTimeout: config.watchTimeout,
    });
    this.graph = new Graph();
    this.parser = new ParserModule();

    space.on('postLoad', (_, slice) => {
      slice.modules.forEach(([name, source]) => this.addComponent(name, source));
    });
    space.on('postReload', (_, slice) => {
      Object.entries(slice.modules).forEach(([name, source]) => this.addComponent(name, source));
    });
    space.on('error', e => config.logger.error(e));
  }
}

export { Container, ContainerError };

//
// class ComponentContainer {
//   constructor() {
//     this.components = new Map();
//     this.graph = null;
//   }
//
//   register(name, component) {
//     if (!(component instanceof Component)) {
//       throw new Error('Component must be an instance of Component class');
//     }
//
//     this.components.set(name, component);
//     return this;
//   }
//
//   clear() {
//     this.components.clear();
//     this.graph = null;
//   }
//
//   async build() {
//     if (!this.graph) this.buildGraph();
//     this.detectedCircularDependencies();
//
//     const instances = [];
//
//     for (const name of this.components.keys()) {
//       const component = this.components.get(name);
//       if (!component) {
//         throw new Error(`Component with name "${name}" not found`);
//       }
//
//       instances.push([name, await component.getInstance(this)]);
//     }
//
//     return Object.freeze(Object.fromEntries(instances));
//   }
//
//   async getInstance(name) {
//     const component = this.components.get(name);
//     if (!component) {
//       throw new Error(`Component with name "${name}" not found`);
//     }
//     return component.getInstance(this);
//   }
// }
