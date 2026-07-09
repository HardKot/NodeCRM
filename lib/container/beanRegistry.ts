import { BeanError, BuildSymbol } from '#constant';
import { Result, Types } from '#utils';

import { Bean } from './bean.ts';
import { BeanBuilder } from './beanBuilder.ts';

export { BeanRegistry };

class BeanRegistry {
  #bindings: Map<string, IBean>;
  #beans: Set<IBean>;

  constructor() {
    this.#bindings = new Map();
    this.#beans = new Set();

    Object.freeze(this);
  }

  add<T>(def: IBean<T>) {
    if (Types.isNotInstanceOf(def, Bean)) throw new BeanError('Invalid bean definition');
    if (this.#beans.has(def)) throw new BeanError(`Bean already registered: ${def.name}`);

    this.#beans.add(def);
    for (const alias of def.aliases) {
      if (this.#bindings.has(alias)) throw new BeanError(`Duplicate bean name: ${alias}`);
      this.#bindings.set(alias, def);
    }
  }

  getDef<T>(alias: string): IBean<T> {
    const bean = this.#bindings.get(alias);
    if (!bean) throw new BeanError(`Bean not found: ${alias}`);
    return bean;
  }

  getAllDefs() {
    return Array.from(this.#beans.values());
  }

  validate(): Result<null> {
    const resultDetectedMissing = this.#detectedMissing();
    if (resultDetectedMissing.isFailure) return resultDetectedMissing;

    const resultCircularDependencies = this.#detectedCircular();
    if (resultCircularDependencies.isFailure) return resultCircularDependencies;

    return Result.success(null);
  }

  binder(callback: { <T>(builder: IBeanBuilder<T>): void }) {
    const builder = new BeanBuilder();

    callback(builder);
    const bean = builder[BuildSymbol]();

    this.add(bean);
  }

  #detectedCircular() {
    const visited = new Set();
    const recStack = new Set();

    const hasCycle = (name: string, path: string[] = []): void => {
      if (recStack.has(name)) {
        const cycle = [...path, name];
        const cycleStart = cycle.indexOf(name);
        throw new BeanError(`Circular dependency detected: ${cycle.slice(cycleStart).join(' -> ')}`);
      }
      if (visited.has(name)) return;
      visited.add(name);
      recStack.add(name);
      const node = this.#bindings.get(name)!;
      for (const dep of node.deps) hasCycle(dep, [...path, name]);
      recStack.delete(name);
    };

    try {
      for (const graphName of this.#bindings.keys()) hasCycle(graphName);
      return Result.success(null);
    } catch (e) {
      const error = Types.normolizeError(e);
      return Result.failure<null>(error);
    }
  }

  #detectedMissing() {
    const missingsDependency: { [key: string]: string[] } = {};
    let isResult = true;

    for (const component of this.#bindings.values()) {
      missingsDependency[component.name] = [];
      for (const dep of component.deps) {
        if (!this.#bindings.has(dep)) {
          missingsDependency[component.name].push(dep);
          isResult = false;
        }
      }
    }

    if (isResult) return Result.success(null);
    let text = 'Missing dependency:';

    for (const key in missingsDependency) {
      const deps = missingsDependency[key];
      if (!deps.length) continue;
      text += `\n Component "${key}" depends on ${deps.map((it) => `"${it}"`).join(',')}, which is not registered in the container.`;
    }

    return Result.failure<null>(new BeanError(text));
  }
}
