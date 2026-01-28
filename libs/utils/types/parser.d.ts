interface ParserOptions<T> {
  parseArray?: <TT>(source: TT[]) => T;
  parseObject?: (source: object) => T;
  parseString?: (source: string) => T;
  parseNumber?: (source: number) => T;
  parseBoolean?: (source: boolean) => T;
  parseFunction?: (source: Function) => T;
  parseClass?: (source: Function) => T;
  parseSymbol?: (source: symbol) => T;
}

export class ParserError extends Error {}

export class Parser<T, Options = ParserOptions<T>, ParserOptions> {
  static of(options: ParserOptions): <TT>(source: any, options?: TT) => T;
  private constructor(options: ParserOptions);
}
