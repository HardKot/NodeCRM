import { Types } from '#utils';
import { CoreError } from './errors.js';

export { Package };

class Package {
  constructor({ name, group, package: package_ }) {
    this.name = name;
    this.group = group ?? 'npm';
    this.package = package_;

    if (!this.name) throw new CoreError('Package name is undefiend');
    if (Types.isFunction(this.loadPackage)) throw new CoreError('Package loader is not function');

    Object.freeze(this);
  }

  toString() {
    let text = `[${this.group}] ${this.name}`;
    return text;
  }

  static Node = class NodePackage extends Package {
    constructor(props) {
      super({ ...props, group: 'node' });
    }
  };

  static Npm = class NpmPackage extends Package {
    constructor() {
      super({ ...props, group: 'npm' });
    }
  };
}
