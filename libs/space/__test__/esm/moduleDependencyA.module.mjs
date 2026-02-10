import { MockProviders } from './mockProviders.service.mjs';
import { MockConsumers } from './mockConsumers.controller.mjs';

class ModuleDependencyA {
  static providers = [MockProviders];
  static consumers = [MockConsumers];
}

export { ModuleDependencyA };
