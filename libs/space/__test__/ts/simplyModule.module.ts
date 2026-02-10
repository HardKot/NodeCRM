import { MockProviders } from './mockProviders.service';
import { MockConsumers } from './mockConsumers.controller';

class SimplyModule {
  static providers = [MockProviders];
  static consumers = [MockConsumers];
}

export { SimplyModule };
