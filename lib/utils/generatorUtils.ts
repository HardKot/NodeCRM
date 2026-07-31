import crypto from 'node:crypto';

export { GeneratorUtils };

class GeneratorUtils {
  constructor() {
    throw new Error('GeneratorUtils is a static class and cannot be instantiated');
  }

  static generateId() {
    return crypto.randomInt(1e9).toString(36).padStart(6, '0');
  }
}
