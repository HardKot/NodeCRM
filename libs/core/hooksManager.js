import { CoreError } from './errors.js';

export { HooksManager };

class HooksManager {
  #hooks;

  constructor() {
    this.#hooks = new Map();
  }

  on(name, callback) {
    const set = this.#hooks.get(name);
    if (!set) throw new CoreError(`Hook set ${name} not found`);
    set.add(callback);
  }

  createHooks(name) {
    if (this.#hooks.has(name)) throw new CoreError(`Hook ${name} is using`);
    this.#hooks.set(new Set());
  }

  wrap({ fn, pre, post }) {
    const preRun = pre ? this.getHook(pre) : () => null;
    const postRun = post ? this.getHook(post) : () => null;

    return async (...args) => {
      await preRun(...args);
      const result = await fn(...args);
      await postRun(...args);
      return result;
    };
  }

  getHook(name) {
    const set = this.#hooks.get(name);
    if (!set) throw new CoreError(`Hook set ${name} not found`);

    return async (...args) => {
      for (const fn of set.values()) await fn(...args);
    };
  }
}
