import { DiScope } from './diScope.js';

class Component {
  #instance = null;

  constructor(constructorFn, props = {}) {
    this.constructorFn = constructorFn;
    this.dependencies = props.dependencies || [];
    this.postConstructor = props.postConstructor;
    this.scope = props.scope ?? DiScope.SINGLETON;
    Object.freeze(this);
  }

  getInstance(diContainer) {
    if (this.#instance) return this.#instance;
    return this.createInstance(diContainer);
  }

  async createInstance(diContainer) {
    const dependenciesInstances = await Promise.all(
      this.dependencies.map(dep => diContainer.getInstance(dep))
    );

    const instance = new this.constructorFn(...dependenciesInstances);
    if (this.postConstructor) {
      await instance[this.postConstructor].call(this);
    }

    if (this.scope === 'Singleton') this.#instance = instance;
    return instance;
  }
}

export { Component };
