import { EventEmitter } from 'node:events';

import { DiContainer } from '../diContainer';
import { AppModuleLoader } from '../appModule';
import { MetadataRegistry } from '../metadataRegistry';

class App extends EventEmitter {
  constructor() {
    this.diContainer = new DiContainer();
    this.metadataRegistry = new MetadataRegistry();
    this.appModuleLoader = new AppModuleLoader(this);
  }

  async load() {
    await this.appModuleLoader.load();
    const { modules } = this.appModuleLoader;

    for (const moduleName in modules) {
      const module = modules[moduleName];
      const metatada = module.metadata ?? module.Metadata;

      if (!metatada) continue;

      for (const targetName in metadata) {
        const target = module[targetName];
        if (!target) continue;

        for (const metadataKey in metatada[targetName]) {
          this.metadataRegistry.defineMetadata(
            metadataKey,
            metatada[targetName][metadataKey],
            target
          );
        }
      }
    }
  }
}
