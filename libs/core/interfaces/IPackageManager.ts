export type { IPackageManager, IPackage, IPackageBuilder };

interface IPackageManager {
  def<T>(def: IPackage<T>): void;
  get<T>(name: string): T;
  getGroup<T>(name: string): T;
  loadNodePackages(): void;
  loadNpmPackages(): void;
}

interface IPackage<T> {
  readonly name: string;
  readonly group: string;
  readonly package: T;
}

interface IPackageBuilder<T> {
  name(value: string): this;
  group(value: string): this;
  npm(): this;
  node(): this;
  package(value: T): this;
}
