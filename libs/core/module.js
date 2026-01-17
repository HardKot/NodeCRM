import { ObjectUtils, Parser, TreeNode, Types } from '../utils/index.js';

const moduleParser = new Parser({
  parseObject: function (source, options) {
    return new Module(
      ObjectUtils.firstNotNullValue('name', source, options),
      source.bootstrap ?? (() => source),
      ObjectUtils.firstNotNullValue('providers', source, options),
      ObjectUtils.firstNotNullValue('consumers', source, options),
      ObjectUtils.firstNotNullValue('imports', source, options)
    );
  },
  parseFunction: function (source, options) {
    return new Module(
      ObjectUtils.firstNotNullValue('name', source, options),
      source,
      ObjectUtils.firstNotNullValue('providers', source, options),
      ObjectUtils.firstNotNullValue('consumers', source, options),
      ObjectUtils.firstNotNullValue('imports', source, options)
    );
  },
  parseClass: function (source, options) {
    let bootstrap = source.bootsrap;
    if (!Types.isFunction(bootstrap)) {
      bootstrap = (app, module) => new source(app).bootstrap(module);
    }

    return new Module(
      ObjectUtils.firstNotNullValue('name', source, options),
      bootstrap,
      ObjectUtils.firstNotNullValue('providers', source, options),
      ObjectUtils.firstNotNullValue('consumers', source, options),
      ObjectUtils.firstNotNullValue('imports', source, options)
    );
  },
});

class Module {
  /** @type {TreeNode<Module>} */
  #graph;

  constructor(name, bootstrap, providers = [], consumers = [], imports = []) {
    this.#graph = new TreeNode(this, null);
    this.name = name;
    this.bootsrap = bootstrap;

    this.providers = providers;
    this.consurmers = consumers;
    this.imports = imports.map(it => Module.parse(it));

    for (const module of this.imports) {
      this.#graph.add(module.#graph);
      module.#graph.parent = this;
    }

    Object.freeze(this);
  }

  #providersCache = null;
  get allProviders() {
    if (this.#providersCache) return this.#providersCache;
    const providers = new Set(this.providers);
    for (const module of this.imports) {
      for (const provider of module.allProviders) {
        providers.add(provider);
      }
    }
    this.#providersCache = Array.from(providers);
    return this.#providersCache;
  }

  #consumersCache = null;
  get allConsumers() {
    if (this.#consumersCache) return this.#consumersCache;
    const consumers = new Set(this.consurmers);
    for (const module of this.imports) {
      for (const consumer of module.allConsumers) {
        consumers.add(consumer);
      }
    }
    this.#consumersCache = Array.from(consumers);
    return this.#consumersCache;
  }

  hasCircle() {
    return this.#graph.hasCircle();
  }

  async run(app) {
    await this.bootsrap(app, this);
    await Promise.all(this.imports.map(it => it.run(app)));
  }

  static parse(source, options = {}) {
    return moduleParser.parse(source, options);
  }
}

export { Module, moduleParser };
