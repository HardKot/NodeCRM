const DiScope = Object.freeze({
  Singleton: Symbol(),
  Prototype: Symbol(),
});

class DiContainerError extends Error {}

class DiContainer {
  #components;
  #singletons;
  #tags;

  constructor() {
    this.#components = new Map();
    this.#singletons = new Map();
    this.#tags = new Map();
  }

  registration(name, factory, options = {}) {
    if (this.#components.has(name)) {
      throw new DiContainerError(`Component with name is registration`);
    }

    if (!options.scope) options.scope = DiScope.Singleton;

    const component = {
      factory: factory,
      name: name,
      dependencies: options.dependencies ?? [],
      isSingleton: options.scope === DiScope.Singleton,
      postConstructor: options.postConstructor,
    };

    this.#components.set(name, component);

    for (const tag of options.tags ?? []) {
      if (!this.#tags.has(tag)) this.#tags.set(tag, new Set());
      const set = this.#tags.get(tag);
      set.add(name);
    }

    return this;
  }

  get(name) {
    const instance = this.#singletons.get(name);
    if (!!instance) {
      return instance;
    }

    return this.#buildComponent(name);
  }

  getListByTag(tag) {
    if (!tag) return [];
    if (!this.#tags.has(tag)) return [];

    const components = this.#tags.get(tag);
    const result = [];

    for (const name of components) {
      result.push(this.get(name));
    }

    return result;
  }

  #buildComponent(name) {
    const component = this.#components.get(name);
    if (!component) throw new DiContainerError(`Factory for ${name} not found`);

    const dependencies = component.dependencies.map(it => this.get(it));
    const instance = new component.factory(...dependencies);

    if (component.postConstructor) instance[component.postConstructor]?.apply(instance);

    if (component.isSingleton) this.#singletons.set(name, instance);

    return instance;
  }
}

export { DiContainer, DiContainerError, DiScope };
