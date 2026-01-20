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
}

module.exports = { ObjectUtils };
