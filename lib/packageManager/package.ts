import { PackageGroups } from '#constant';

export { Package };
export type { PackageProps };

interface PackageProps<T extends object> {
  name: string;
  group: IPackageGroupsValue;
  package: T;
}

class Package<T extends object> implements IPackage<T> {
  readonly name: string;
  readonly group: IPackageGroupsValue;
  readonly package: T;

  constructor({ name, group, package: package_ }: PackageProps<T>) {
    this.name = name;
    this.group = group;
    this.package = package_;

    Object.freeze(this);
  }

  toString() {
    let text = `[${this.group}] ${this.name}`;
    return text;
  }

  static Node = class NodePackage<T extends object> extends Package<T> {
    constructor(props: Omit<PackageProps<T>, 'group'>) {
      super({ ...props, group: PackageGroups.NODE });
    }
  };

  static Npm = class NpmPackage<T extends object> extends Package<T> {
    constructor(props: Omit<PackageProps<T>, 'group'>) {
      super({ ...props, group: PackageGroups.NPM });
    }
  };

  static Lib = class LibPackage<T extends object> extends Package<T> {
    constructor(props: Omit<PackageProps<T>, 'group'>) {
      super({ ...props, group: PackageGroups.LIB });
    }
  };
}
