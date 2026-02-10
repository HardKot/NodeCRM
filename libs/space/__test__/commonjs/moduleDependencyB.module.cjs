const { MockProvidersB } = require('./mockProvidersB.module');
const { ModuleDependencyA } = require('./moduleDependencyA.module');

class ModuleDependencyB {
  static providers = [MockProvidersB];
  static imports = [ModuleDependencyA];
}

exports = { ModuleDependencyB };
