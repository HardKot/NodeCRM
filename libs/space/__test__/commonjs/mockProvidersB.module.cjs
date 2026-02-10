const { MockProviders } = require('./mockProviders.service');

class MockProvidersB {
  static $inject = [MockProviders];

  constructor(mockProviders) {
    this.mockProviders = mockProviders;
  }
}

exports = { MockProvidersB };
