export type { IBeanRegistry, IBean, IBeanBuilder, ScopeValue, ICallback };

type ScopeValue = 0 | 1 | 2;

type ICallback<T> = (instance: T) => void;

interface IBeanRegistry {
  add<T>(def: IBean<T>): void;
  getDef<T>(alias: string): IBean<T>;
  getAllDefs<T>(): readonly IBean<T>[];

  // TODO: Заменить на Result
  validate(): true;
  binder<T>(callback: { (builder: IBeanBuilder<T>): Promise<void> }): Promise<void>;
}

interface IBean<T> {
  readonly name: string;
  readonly factory: (...deps: any[]) => T;
  readonly scope: ScopeValue;
  readonly deps: string[];
  readonly aliases: string[];
  readonly eager: boolean;
  readonly async: boolean;

  readonly postConstructor: ICallback<T>;
  readonly preDestroy: ICallback<T>;

  isSingleton(): boolean;
  isTransient(): boolean;
  isScoped(): boolean;
}

interface IBeanBuilder<T> {
  name(value: string): this;
  eager(): this;
  async(): this;
  singleton(): this;
  transient(): this;
  scoped(): this;
  dependsOn(...deps: string[]): this;
  alias(...deps: string[]): this;

  class(Class: { new(...args: any[]): T }): this;
  factory(factory: { (...args: any[]): T }): this;
  postConstruct(callback: ICallback<T>): this;
  preDestroy(callback: ICallback<T>): this;
}
