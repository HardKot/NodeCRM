import { firstNonNull } from '../common/utils.js';
import { Flow } from '../common/flow.js';

export class DependenciesInjection {
  constructor(app) {
    this.components = new Map();
    this.instances = new Map();
    this.app = app;
  }

  register(factory, options = {}) {
    const name = firstNonNull(options.name, factory.name);
    if (!name) throw new Error('Component name is required');

    const singleton = firstNonNull(options.singleton, factory.singleton, true);
    const dependencies = firstNonNull(options.dependencies, factory.dependencies, []);

    this.components.set(name, { factory, singleton, dependencies, name });
  }

  resolve(name) {
    if (this.instances.has(name)) return this.instances.get(name);
    if (!this.components.has(name))
      throw new Error(`Component with name ${name} is not registered`);

    const component = this.components.get(name);

    const dependencies = component.dependencies.map(dep => this.resolve(dep));
    const instance = new component.factory(...dependencies);

    if (component.singleton) {
      this.instances.set(name, instance);
    }

    return instance;
  }

  async load() {
    await Flow.of(this.app.modules)
      .filter(it => it.isScript() && it.name.toLowerCase().includes('.service'))
      .map(async it => await it.import())
      .map(it => it.default)
      .filter(it => typeof it === 'function')
      .forEach(it => this.register(it));
  }
}
