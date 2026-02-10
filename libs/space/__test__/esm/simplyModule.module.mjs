import { MockProviders } from './mockProviders.service.mjs';
import { MockConsumers } from './mockConsumers.controller.mjs';

class SimplyModule {
  static providers = [MockProviders];
  static consumers = [MockConsumers];
}

export { SimplyModule };
