import { AsyncLocalStorage } from 'node:async_hooks';

class RequestContext {
  constructor() {}

  static #asyncLocalStorage = new AsyncLocalStorage();
  static run(request, callback) {
    return RequestContext.#asyncLocalStorage.run({ request }, callback);
  }
  static current() {
    const store = RequestContext.#asyncLocalStorage.getStore();
    if (!store) {
      throw new Error(
        'No request context available. Make sure to run within RequestContext.run().'
      );
    }
    return store.request;
  }
}

export { RequestContext };
