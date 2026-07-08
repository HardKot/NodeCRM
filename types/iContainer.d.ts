declare interface ResolveOptions {
  scopeId?: string;
}

declare interface IContainer {
  add<T>(def: IBean<T>): void;
  getDef<T>(alias: string): IBean<T>;

  binder(callback: { <T>(builder: IBeanBuilder<T>): Promise<void> }): Promise<void>;

  build(): Promise<void>;
  resolve<T>(alias: string, options?: ResolveOptions): Promise<T>;

  destroyAll(): Promise<void>;
  destroyScoped(scopeId: string): Promise<void>;
}
