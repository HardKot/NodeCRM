declare interface IPackage<T> {
  readonly name: string;
  readonly group: IPackageGroupsValue;
  readonly package: T;
}

declare interface IPackageBuilder<T> {
  name(value: string): this;
  group(value: string): this;
  npm(): this;
  node(): this;
  lib(): this;
  package(value: T): this;
}
