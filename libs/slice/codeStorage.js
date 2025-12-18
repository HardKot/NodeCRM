const CodeStorage = Object.freeze({
  _storage: new Map(),

  has(name) {
    return this._storage.has(name);
  },

  get(name) {
    return this._storage.get(name);
  },

  set(name, codeInstance) {
    this._storage.set(name, codeInstance);
  },

  delete(name) {
    this._storage.delete(name);
  },
});

export { CodeStorage };
