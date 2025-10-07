import * as config from './config.js';

const cache = new Map();

class CachedValue {
  constructor(key, value, timeout) {
    this.key = key;
    this.value = value;
    this.timeout = timeout;

    this.timeoutId = this.createTimeout();
  }

  getValue() {
    this.timeoutId = this.createTimeout();

    this.timeoutId = setTimeout(() => {
      cache.delete(this.key);
    });

    return this.value;
  }

  createTimeout() {
    clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(() => {
      cache.delete(this.key);
    }, this.timeout);

    return this.timeoutId;
  }
}

const defaultTimeout = config.get('cached.ttl', 600) * 1000;

export function set(key, value, options = {}) {
  const timeout = options.timeout || defaultTimeout;

  const cachedValue = new CachedValue(key, value, timeout);
  cache.set(key, cachedValue);
  return cachedValue;
}

export function get(key) {
  const cachedValue = cache.get(key);
  if (!cachedValue) return null;
  return cachedValue.getValue();
}

export function del(key) {
  cache.delete(key);
}

export function clear() {
  cache.clear();
}

export function has(key) {
  return cache.has(key);
}
