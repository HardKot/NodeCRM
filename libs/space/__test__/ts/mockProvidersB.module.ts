import { MockProviders } from './mockProviders.service';

class MockProvidersB {
  static $inject = [MockProviders];

  constructor(public mockProviders: MockProviders) {}
}

export { MockProvidersB };
