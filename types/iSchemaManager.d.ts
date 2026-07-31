declare interface ISchemaManager<T> {
  get(alias: string): T | null;
  add(alias: string, schema: T): void;
  create(alias: string, schema: unknown): T;

  parse(source: unknown): T;
  parseString(source: string): T;
  parseObject(source: object): T;
  parseArray(source: unknown[]): T;
  parseFunction(source: () => unknown): T;
  parseClass<U>(source: { new(...args: any[]): U; schema?: object }): T;
}
