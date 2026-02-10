const { MockProviders } = require('./mockProviders.service');
const { MockConsumers } = require('./mockConsumers.controller');

class ModuleDependencyA {
  static providers = [MockProviders];
  static consumers = [MockConsumers];
}

exports = { ModuleDependencyA };
