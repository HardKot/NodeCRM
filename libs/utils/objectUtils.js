class ObjectUtils {
  constructor() {
    throw new Error('ObjectUtils is a static class and cannot be instantiated');
  }

  static firstNotNullValue(property, ...args) {
    for (const obj of args) {
      if (obj[property]) {
        return obj[property];
      }
    }
    return null;
  }

  static goTo(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current && Object.prototype.hasOwnProperty.call(current, key)) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    return current;
  }

  static deepFreeze(object) {
    Object.freeze(object);

    for (const key in object) {
      if (
        object.hasOwnProperty(key) &&
        object[key] !== null &&
        (typeof object[key] === 'object' || typeof object[key] === 'function') &&
        !Object.isFrozen(object[key])
      ) {
        this.deepFreeze(object[key]);
      }
    }

    return object;
  }

  static deepAssign(target, ...sources) {
    for (const source of sources) {
      for (const key in source) {
        if (
          source.hasOwnProperty(key) &&
          source[key] !== null &&
          typeof source[key] === 'object' &&
          !Array.isArray(source[key])
        ) {
          if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {};
          }
          this.deepAssign(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    return target;
  }

  static getMethodNames(obj) {
    const methods = new Set();
    let current = obj;

    while (current && current !== Object.prototype) {
      for (const key of Object.getOwnPropertyNames(current)) {
        if (typeof obj[key] === 'function' && key !== 'constructor') {
          methods.add(key);
        }
      }
      current = Object.getPrototypeOf(current);
    }

    return Array.from(methods);
  }

  static toBase64Url(obj) {
    const json = JSON.stringify(obj);
    const base64 = Buffer.from(json).toString('base64');
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
}

module.exports = { ObjectUtils };
