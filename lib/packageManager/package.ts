import type { IPackage } from './interface';

export { Package };

export type { PackageGroups };

type PackageGroups = 'node' | 'npm' | string;

interface PackageProps<T extends object> {
  name: string;
  group: string;
  package: T;
}

class Package<T extends object> implements IPackage<T> {
  readonly name: string;
  readonly group: 'node' | 'npm' | string;
  readonly package: T;

  constructor({ name, group, package: package_ }: PackageProps<T>) {
    this.name = name;
    this.group = group ?? 'npm';
    this.package = package_;

    Object.freeze(this);
  }

  toString() {
    let text = `[${this.group}] ${this.name}`;
    return text;
  }

  static Node = class NodePackage<T extends object> extends Package<T> {
    constructor(props: Omit<PackageProps<T>, 'group'>) {
      super({ ...props, group: 'node' });
    }
  };

  static Npm = class NpmPackage<T extends object> extends Package<T> {
    constructor(props: Omit<PackageProps<T>, 'group'>) {
      super({ ...props, group: 'npm' });
    }
  };
}
