import { BuildSymbol, CoreError, PackageGroups } from '#constant';
import { Package } from './package.ts';

import type { PackageProps } from './package.ts';

export { PackageBuilder };

class PackageBuilder<T extends object> implements IPackageBuilder<T> {
  #props: PackageProps<T>;
  constructor() {
    this.#props = {
      name: '',
      group: PackageGroups.LIB,
      package: {} as T,
    };
  }

  name(name: string): this {
    this.#props.name = name;
    return this;
  }

  group(group: string): this {
    this.#props.group = PackageGroups[group.toUpperCase() as keyof typeof PackageGroups] ?? PackageGroups.LIB;
    return this;
  }

  node(): this {
    this.#props.group = PackageGroups.NODE;
    return this;
  }

  npm(): this {
    this.#props.group = PackageGroups.NPM;
    return this;
  }

  lib(): this {
    this.#props.group = PackageGroups.LIB;
    return this;
  }

  package(package_: T): this {
    this.#props.package = package_;
    return this;
  }

  [BuildSymbol](): IPackage<T> {
    if (!this.#props.name) throw new CoreError('Package name is required');
    if (!this.#props.package) throw new CoreError('Package instance is required');

    return new Package<T>(this.#props);
  }
}
