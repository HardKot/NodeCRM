import { DiComponent } from './diComponent.js';

class DiContainerError extends Erro { }

class DiContainer {
  constructor() {
    this.components = new Map();
  }

  registration(name, component) {
    if (component instanceof DiComponent) {
      this.components.set(name, component);
    }

    return this;
  }

  get(name) {
    const component = this.components.get(name);
    if (!component) return null;

    return component.getInstance();
  }

  buildComponent(name) {
    const component = this.components.get(name);
    if (!component) throw new DiContainerError(`Factory for ${name} not found`);

    const dependencies = factory.dependencies.map(it => this.get(it));
    const instance = component.getInstance(dependencies);

    return instance;
  }

  getByTag(tag) {
    const list = [];
    this.components.forEach(it => {
      if (it.tags.includes(tag)) list.push(it);
    });

    return list;
  }
}

export { DiContainer };
