export type { IContainer, ResolveOptions };

interface ResolveOptions {
  scopeId?: string;
}

interface IContainer {
  build(): Promise<void>;
  resolve<T>(alias: string, options?: ResolveOptions): Promise<T>;

  destroyAll(): Promise<void>;
  destroyScoped(scopeId: string): Promise<void>;
}
