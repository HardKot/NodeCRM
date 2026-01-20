class Routes {
  #children = [];
  #regexpKey = null;

  constructor(key = 'index') {
    this.key = key;
    this.isDynamic = key.startsWith('<') && key.endsWith('>');

    this.get = null;
    this.post = null;
    this.put = null;
    this.delete = null;

    if (this.isDynamic) {
      const type = key.slice(1, -1);
      switch (type) {
        case 'string':
          this.#regexpKey = /^\w+$/;
          break;
        case 'number':
          this.#regexpKey = /^\d+$/;
          break;
        default:
          this.#regexpKey = /^[\w\d]+$/;
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
      child = new Routes(childKey);
      this.#children.push(child);
      this.#children.sort((a, b) => {
        if (a.isDynamic && !b.isDynamic) return 1;
        if (!a.isDynamic && b.isDynamic) return -1;
        return 0;
      });
    }

    child.register(value, otherPath.join('/'), method);

    return this;
  }

  route(key, method = 'get') {
    if (key.startsWith('/')) key = key.slice(1);
    if (key.endsWith('/')) key = key + 'index';

    const [childKey, ...otherPath] = key.split('/');

    if (!childKey) return this[method] ?? null;

    const child = this.#children.find(it => it.#regexpKey.test(childKey));

    return child?.route(otherPath.join('/'), method) ?? null;
  }

  static create(consumers = []) {
    const root = new Routes();

    for (const consumer of consumers) {
      root.register(consumer, consumer.mapping, consumer.method ?? 'get');
    }

    return root;
  }
}

module.exports = { Routes };
