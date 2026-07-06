
declare interface ResolveOptions {
  scopeId?: string;
}

declare interface IContainer {
  build(): Promise<void>;
  resolve<T>(alias: string, options?: ResolveOptions): Promise<T>;

  destroyAll(): Promise<void>;
  destroyScoped(scopeId: string): Promise<void>;
}
