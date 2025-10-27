class DiComponent {
  #instance;

  constructor(factory, options = {}) {
    this.factory = factory.bind(factory);
    factory;
    this.dependencies = factory.dependencies ?? options.dependencies ?? [];
    this.isSingleon = factory.singleton ?? options.singleton ?? true;
    this.postConstructorMethod =
      factory.postConstructorMethod ?? options.postConstructorMethod ?? 'postConstructor';
    this.tags = options.tags || [];
  }

  getInstance(deps = []) {
    if (this.#instance) return this.#instance;

    const instance = new this.factory(...deps);
    instance[this.postConstructorMethod]?.apply(instance);

    if (this.isSingleon) this.#instance = instance;

    return this.#instance;
  }
}

export { DiComponent };
