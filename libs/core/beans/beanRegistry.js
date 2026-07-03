import { Types } from '../../utils/index.js';
import { Bean } from './Bean.js';
import { CoreError } from '../errors.js';
import { BuildSymbol } from './symbols.js';

export { BeanRegistry };

class BeanRegistry {
  #bindings;
  #beans;

  constructor(app) {
    this.#bindings = new Map();
    this.#beans = new Set();

    this.app = app;
    Object.freeze(this);
  }

  add(def) {
    if (Types.isNotInstanceOf(def, Bean)) throw new CoreError('Invalid bean definition');
    if (this.#beans.has(def)) throw new CoreError(`Bean already registered: ${def.name}`);

    this.#beans.add(def);
    for (const alias of def.aliases) {
      if (this.#bindings.has(alias)) throw new CoreError(`Duplicate bean name: ${alias}`);
      this.#bindings.set(alias, def);
    }
  }

  getDef(alias) {
    const bean = this.#bindings.get(alias);
    if (!bean) throw new CoreError(`Bean not found: ${alias}`);
    return bean;
  }

  getAllDefs() {
    return Array.from(this.#beans.values());
  }

  validate() {
    if (this.#detectedMissing()) throw new CoreError('Missing dependencies detected');
    if (this.#detectedCircular()) throw new CoreError('Circular dependencies detected');
    return true;
  }

  async binder(callback) {
    const builder = new BeanBuilder();

    await callback(builder);
    const bean = builder[BuildSymbol]();

    this.add(bean);
  }

  #detectedCircular() {
    const visited = new Set();
    const recStack = new Set();
    const hasCycle = (name, path = []) => {
      if (recStack.has(name)) {
        const cycle = [...path, name];
        const cycleStart = cycle.indexOf(name);
        throw new CoreError(
          `Circular dependency detected: ${cycle.slice(cycleStart).join(' -> ')}`
        );
      }
      if (visited.has(name)) return false;
      visited.add(name);
      recStack.add(name);
      const node = this.#bindings.get(name);
      for (const dep of node?.inject ?? []) hasCycle(dep, [...path, name]);
      recStack.delete(name);
      return false;
    };
    for (const graphName of this.#bindings.keys()) {
      hasCycle(graphName);
    }
    return false;
  }

  #detectedMissing() {
    for (const component of this.#bindings.values()) {
      for (const dep of component.inject) {
        if (!this.#bindings.has(dep)) {
          throw new CoreError(
            `Missing dependency: Component "${component.name.toString()}" depends on "${dep.toString()}", which is not registered in the container.`
          );
        }
      }
    }
    return false;
  }
}
