import { MockProviders } from './mockProviders.service.mjs';

class MockProvidersB {
  static $inject = [MockProviders];

  constructor(mockProviders) {
    this.mockProviders = mockProviders;
  }
}

export { MockProvidersB };
