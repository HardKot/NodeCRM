const { ObjectUtils, Parser } = require('../utils/index.js');

const moduleParser = new Parser({
  parseObject: function (source, options) {
    return new Module(
      ObjectUtils.firstNotNullValue('name', source, options),
      () => source,
      ObjectUtils.firstNotNullValue('imports', source, options)
    );
  },
  parseFunction: function (source, options) {
    return new Module(
      ObjectUtils.firstNotNullValue('name', source, options),
      source,
      ObjectUtils.firstNotNullValue('imports', source, options)
    );
  },
  parseClass: function (source, options) {
    return new Module(
      ObjectUtils.firstNotNullValue('name', source, options),
      app => new source(app),
      ObjectUtils.firstNotNullValue('imports', source, options)
    );
  },
});

class Module {
  constructor(name, factory, imports = []) {
    this.name = name;

    const instance = factory();
    this.imports = imports?.map(it => Module.parse(it)) ?? [];

    this.providers = new Set(
      [[instance.providers ?? []], this.imports.map(it => it.providers ?? [])].flat(2)
    )
      .values()
      .toArray();

    this.providers
      .filter(it => !it.type)
      .forEach(it => {
        it.type = 'provider';
      });

    this.consumers = new Set(
      [[instance.consumers ?? []], this.imports.map(it => it.consumers ?? [])].flat(2)
    )
      .values()
      .toArray();

    this.consumers
      .filter(it => !it.type)
      .forEach(it => {
        it.type = 'consumer';
      });

    this.selfOnModuleInit = instance.onModuleInit?.bind(instance);
    this.selfOnApplicationBootstrap = instance.onApplicationBootstrap?.bind(instance);
    this.selfOnModuleDestroy = instance.onModuleDestroy?.bind(instance);
    this.selfOnApplicationShutdown = instance.onApplicationShutdown?.bind(instance);

    Object.freeze(this);
  }

  async onModuleInit(app) {
    await this.selfOnModuleInit?.(app);
    for (const importedModule of this.imports) {
      await importedModule.onModuleInit(app);
    }
  }

  async onApplicationBootstrap(app) {
    await this.selfOnApplicationBootstrap?.(app);
    for (const importedModule of this.imports) {
      await importedModule.onApplicationBootstrap(app);
    }
  }

  async onModuleDestroy(app) {
    await this.selfOnModuleDestroy?.(app);
    for (const importedModule of this.imports) {
      await importedModule.onModuleDestroy(app);
    }
  }

  async onApplicationShutdown(app) {
    await this.selfOnApplicationShutdown?.(app);
    for (const importedModule of this.imports) {
      await importedModule.onApplicationShutdown(app);
    }
  }

  static parse(source, options = {}) {
    return moduleParser.parse(source, options);
  }
}

module.exports = { Module, moduleParser };
