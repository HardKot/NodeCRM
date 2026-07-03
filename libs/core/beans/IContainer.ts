export type { IContainer };

interface IContainer {
  build(): Promise<void>;
  resolve<T>(alias: string, options?: { scopeId?: string }): Promise<T>;

  destroyAll(): Promise<void>;
  destroyScoped(scopeId: string): Promise<void>;
}
