
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
