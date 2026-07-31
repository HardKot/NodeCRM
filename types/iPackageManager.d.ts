declare interface IPackageManager {
  def<T>(def: IPackage<T>): void;
  get<T>(name: string): T | null;
  getGroup<T>(name: IPackageGroupsValue): Readonly<T | {}>;
  loadNodePackages(): void;
  loadNpmPackages(): void;
  loadLibPackages(): void;
}
