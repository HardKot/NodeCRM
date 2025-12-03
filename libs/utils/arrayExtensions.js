import { FieldType } from '../schema/fieldType.js';
import { isFunction } from './types.js';

class ArrayExtensions extends Array {
  constructor(...args) {
    super(...args);
  }

  binarySearchInex(compareFn) {
    if (!isFunction(compareFn))
      compareFn = value => {
        if (value === compareFn) return 0;
        return value < compareFn ? -1 : 1;
      };

    let low = 0;
    let high = this.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const cmp = compareFn(this[mid]);

      if (cmp === 0) {
        return mid;
      } else if (cmp < 0) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return -1;
  }

  binarySearch(compareFn) {
    const index = this.binarySearchInex(compareFn);
    if (index === -1) return null;
    return this[index];
  }

  static from(...args) {
    return new ArrayExtensions(...args);
  }
}

export { ArrayExtensions };
