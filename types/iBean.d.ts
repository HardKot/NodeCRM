
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
