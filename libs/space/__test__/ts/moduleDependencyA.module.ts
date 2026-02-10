import { MockProviders } from './mockProviders.service';
import { MockConsumers } from './mockConsumers.controller';

class ModuleDependencyA {
  static providers = [MockProviders];
  static consumers = [MockConsumers];
}

export { ModuleDependencyA };
