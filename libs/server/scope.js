import { AsyncLocalStorage } from 'node:async_hooks';

class Scope {
  constructor() {
    this.user = null;
  }

  static #asyncLocalStorage = new AsyncLocalStorage();
  static run() {
    let [scope, callback] = arguments;
    if (arguments.length === 1) {
      scope = new Scope();
      callback = arguments[0];
    }
    return Scope.#asyncLocalStorage.run(scope, callback);
  }
  static get current() {
    const store = Scope.#asyncLocalStorage.getStore();
    if (!store) {
      throw new Error(
        'No request context available. Make sure to run within RequestContext.run().'
      );
    }
    return store.request;
  }
}

export { Scope };
