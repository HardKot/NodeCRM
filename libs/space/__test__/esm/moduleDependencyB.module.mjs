import { MockProvidersB } from './mockProvidersB.module';
import { ModuleDependencyA } from './moduleDependencyA.module.mjs';

class ModuleDependencyB {
  static providers = [MockProvidersB];
  static imports = [ModuleDependencyA];
}

export { ModuleDependencyB };
