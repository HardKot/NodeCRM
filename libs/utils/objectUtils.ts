export class ObjectUtils {
  constructor() {
    throw new Error('ObjectUtils is a static class and cannot be instantiated');
  }

  static firstNotNullValue<T>(property: string, ...args: Record<string, any>[]): T | null {
    for (const obj of args) {
      if (obj[property]) {
        return obj[property];
      }
    }
    return null;
  }

  static goTo<T = any>(obj: Record<string, any>, path: string, defaultValue?: T): T | undefined {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
      if (current && Object.prototype.hasOwnProperty.call(current, key)) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    return current;
  }

  static deepFreeze<T extends object>(object: T): T {
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

  static deepAssign<T extends object>(target: T, ...sources: Partial<T>[]): T {
    for (const source of sources) {
      for (const key in source) {
        if (
          source.hasOwnProperty(key) &&
          source[key] !== null &&
          typeof source[key] === 'object' &&
          !Array.isArray(source[key])
        ) {
          if (!target[key] || typeof target[key] !== 'object') {
            (target as any)[key] = {};
          }
          this.deepAssign((target as any)[key], source[key] as any);
        } else {
          (target as any)[key] = source[key];
        }
      }
    }
    return target;
  }

  static getMethodNames(obj: object): string[] {
    const methods = new Set<string>();
    let current = obj;

    while (current && current !== Object.prototype) {
      for (const key of Object.getOwnPropertyNames(current)) {
        if (typeof (obj as any)[key] === 'function' && key !== 'constructor') {
          methods.add(key);
        }
      }
      current = Object.getPrototypeOf(current);
    }

    return Array.from(methods);
  }

  static toBase64Url(obj: any): string {
    const json = JSON.stringify(obj);
    const base64 = Buffer.from(json).toString('base64');
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
}
