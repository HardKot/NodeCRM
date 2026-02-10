const { MockProviders } = require('./mockProviders.service');
const { MockConsumers } = require('./mockConsumers.controller');

class SimplyModule {
  static providers = [MockProviders];
  static consumers = [MockConsumers];
}

exports = { SimplyModule };
