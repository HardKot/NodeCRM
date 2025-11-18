import events from 'node:events';
import path from 'node:path';
import fsp from 'node:fs/promises';

class AdaptersRegistry extends events.EventEmitter {
  #adapters = new Map();

  constructor(app) {
    super();

    this.app = app;
    this.adaptersPrefix = '@node-adapter/';
    this.userAdapterPath = path.join(this.app.src, 'adapters');
    Object.freeze(this);
  }

  async load() {
    const adapters = this.npmAdapters().concat(await this.app.readModule(this.userAdapterPath));

    for (const modulePath of adapters) {
      const module = await import(modulePath);
      const name = path.basename(modulePath);

      const adapter = module.adapter;
      // Вызываем функцию инициализации адаптера, если она существует
      await module.bootstart?.(this.app);

      if (!name || !adapter) continue;
      this.#adapters.set(name, adapter);
    }
  }

  getAdapters() {
    return this.#adapters.values().toArray();
  }

  get(name) {
    return this.#adapters.get(name);
  }

  set(name, value) {
    this.#adapters.set(name, value);
  }

  npmAdapters() {
    const { dependencies = {} } = this.app.packageJson;
    return Object.keys(dependencies).filter(dependency =>
      dependency.startsWith(this.adaptersPrefix)
    );
  }
}

export { AdaptersRegistry };
