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
}

export { ObjectUtils };
