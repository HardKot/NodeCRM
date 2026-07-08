declare type IBeanCallback<T> = (instance: T) => Promise<void>;

declare interface BeanProps<T> {
  name: string;
  factory: (...deps: any[]) => T;
  scope?: IScopeValue;
  deps?: string[];
  aliases?: string[];
  eager?: boolean;
  async?: boolean;

  postConstruct?: IBeanCallback<T>;
  preDestroy?: IBeanCallback<T>;
}

declare interface IBean<T = any> {
  readonly name: string;
  readonly factory: (...deps: any[]) => T;
  readonly scope: ScopeValue;
  readonly deps: string[];
  readonly aliases: string[];
  readonly eager: boolean;
  readonly async: boolean;

  readonly postConstructor: IBeanCallback<T>;
  readonly preDestroy: IBeanCallback<T>;

  isSingleton(): boolean;
  isTransient(): boolean;
  isScoped(): boolean;
}

declare interface IBeanBuilder<T> {
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
