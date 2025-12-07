import { ComponentParser } from './componentParser.js';
import { ComponentContainer } from './componentContainer.js';

class DiContainerModule {
  constructor() {
    this.parser = new ComponentParser();
    this.container = new ComponentContainer();
  }

  register(name, source) {
    [name, source] = this.#extractArgs(arguments);
    const component = this.parser.parse(source);
    this.container.register(name, component);
    return this;
  }

  async bootStart() {
    return await this.container.build();
  }

  #extractArgs(args) {
    let name, source;
    if (args.length === 1) {
      [name, source] = Object.entries(args[0])[0];
    } else if (args.length >= 2) {
      [name, source] = args;
    }
    return [name, source];
  }
}

export { DiContainerModule };
