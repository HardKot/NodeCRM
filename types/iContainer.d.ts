declare interface ResolveOptions {
  scopeId?: string;
}

declare interface IContainer {
  add<T>(def: IBean<T>): void;
  getDef<T>(alias: string): IBean<T>;

  build(): Promise<void>;
  resolve<T>(alias: string, options?: ResolveOptions): Promise<T>;

  destroyAll(): Promise<void>;
  destroyScoped(scopeId: string): Promise<void>;
}
