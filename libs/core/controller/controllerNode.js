import { ArrayExtensions } from '#lib/utils';

class ControllerNodeError extends Error {}

class ControllerNode {
  #children = [];
  #value = [];
  #regexpKey = null;

  constructor(key = 'index') {
    this.key = key;

    if (key.startsWith('<') && key.endsWith('>')) {
      this.#regexpKey = /^[\d\w]+$/;
    } else {
      this.#regexpKey = new RegExp(`^${key}$`);
    }
  }

  addValue(value, key = undefined) {
    if (!key) key = 'index';
    if (key.endsWith('/')) key = key + 'index';
    if (key.startsWith('/')) key = key.slice(1);

    const [childKey, ...otherPath] = key.split('/');

    if (childKey === 'index') {
      this.#value.push(value);

      return this;
    }

    let child = this.#children.find(it => it.key === childKey);
    if (!child) {
      child = new ControllerNode(childKey);
      this.#children.push(child);
    }

    child.addValue(value, otherPath.join('/'));

    return this;
  }

  getValue(key, valueFilter = null) {
    if (!valueFilter) valueFilter = () => true;

    if (key.startsWith('/')) key = key.slice(1);
    if (key.endsWith('/')) key = key + 'index';

    const [childKey, ...otherPath] = key.split('/');

    if (!childKey) return this.#value.find(valueFilter) ?? null;

    let child = this.#children.find(it => it.#regexpKey.test(childKey));

    return child?.getValue(otherPath.join('/')) ?? null;
  }
}

export { ControllerNode };
