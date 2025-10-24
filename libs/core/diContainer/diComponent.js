class DiComponent {
  #instance;
  #deps;

  constructor(factory, options = {}) {
    this.factory = factory.bind(factory);
    factory;
    this.dependencies = factory.dependencies ?? options.dependencies ?? [];
    this.isSingleon = factory.singleton ?? options.singleton ?? true;
    this.postConstructorMethod =
      factory.postConstructorMethod ?? options.postConstructorMethod ?? 'postConstructor';
  }

  deps(deps) {
    this.#deps = deps;
    return this;
  }

  createInstance() {
    const instance = new this.factory(...this.#deps);
    instance[this.postConstructorMethod]?.apply(instance);

    if (this.isSingleon) this.#instance = instance;

    return instance;
  }

  getInstance() {
    if (this.#instance) return this.#instance;
    return this.createInstance();
  }
}

export { DiComponent };
