import { DiComponent } from './diComponent';

class DiContainerError extends Erro { }

class DiContainer {
  constructor() {
    this.factories = new Map();
    this.components = new Map();
  }

  registration(name, component) {
    if (component instanceof DiComponent) {
      this.factories.set(name, component);
    }

    return this;
  }

  get(name) {
    if (this.components.has(name)) return this.components.get(name);

    const component = this.buildComponent(name);
    if (component.isSingleton) this.components.set(name, component);

    return component;
  }

  buildComponent(name) {
    const factory = this.factories.get(name);
    if (!factory) throw new DiContainerError(`Factory for ${name} not found`);

    const dependencies = factory.dependencies.map(it => this.get(it));
    const component = factory.create(dependencies);

    return component;
  }

  buildTree() {
    for (const name of this.factories.keys()) {
      this.get(name);
    }
  }
}

export { DiContainer };
