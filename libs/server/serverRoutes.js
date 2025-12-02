class ServerRoutes {
  #children = [];
  #regexpKey = null;

  constructor(key = 'index') {
    this.key = key;

    this.get = null;
    this.post = null;
    this.put = null;
    this.delete = null;

    if (key.startsWith('<') && key.endsWith('>')) {
      const type = key.slice(1, -1);
      switch (type) {
        case 'string':
          this.#regexpKey = /^\w+$/;
          break;
        case 'number':
          this.#regexpKey = /^\d+$/;
          break;
        default:
          this.#regexpKey = /^[\d\w]+$/;
      }
    } else {
      this.#regexpKey = new RegExp(`^${key}$`);
    }
  }

  register(value, key = undefined, method = 'get') {
    if (!key) key = 'index';
    if (key.endsWith('/')) key = key + 'index';
    if (key.startsWith('/')) key = key.slice(1);

    const [childKey, ...otherPath] = key.split('/');

    if (childKey === 'index') {
      this[method] = value;
      return this;
    }

    let child = this.#children.find(it => it.key === childKey);
    if (!child) {
      child = new ServerRoutes(childKey);
      this.#children.push(child);
    }

    child.register(value, otherPath.join('/'), method);

    return this;
  }

  route(key) {
    if (key.startsWith('/')) key = key.slice(1);
    if (key.endsWith('/')) key = key + 'index';

    const [childKey, ...otherPath] = key.split('/');

    if (!childKey) return this;

    let child = this.#children.find(it => it.#regexpKey.test(childKey));

    return child?.route(otherPath.join('/')) ?? null;
  }
}

export { ServerRoutes };
