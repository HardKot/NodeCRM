import { DiComponent } from './diComponent.js';

class DiContainerError extends Erro {}

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

    let instance = component.getInstance();

    const dependencies = factory.dependencies.map(it => this.get(it));

    return component;
  }

  getFactoriesList() {
    return [...this.factories.values()];
  }
}

export { DiContainer };
