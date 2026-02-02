import { SourceParser } from '../sourceParser';
class TestParser extends SourceParser<string> {
  protected parseArray(source: unknown[]): string {
    return `array:${source.length}`;
  }
  protected parseFunction(source: Function): string {
    return `function:${source.name}`;
  }
  protected parseClass(source: new (...args: unknown[]) => unknown): string {
    return `class:${source.name}`;
  }
  protected parseObject(source: object): string {
    return `object:${Object.keys(source).length}`;
  }
  protected parseString(source: string): string {
    return `string:${source}`;
  }
}

describe('SourceParser', () => {
  const parser = new TestParser();

  it('Парсинг массива', () => {
    const result = parser.parse([1, 2, 3]);
    expect(result).toBe('array:3');
  });

  it('Парсинг функции', () => {
    function sampleFunction() {}
    const result = parser.parse(sampleFunction);
    expect(result).toBe('function:sampleFunction');
  });

  it('Парсинг класса', () => {
    class SampleClass {}
    const result = parser.parse(SampleClass);
    expect(result).toBe('class:SampleClass');
  });

  it('Парсинг объекта', () => {
    const result = parser.parse({ a: 1, b: 2 });
    expect(result).toBe('object:2');
  });

  it('Парсинг строки', () => {
    const result = parser.parse('hello');
    expect(result).toBe('string:hello');
  });

  it('Попытка парсинга неподдерживаемого типа', () => {
    expect(() => parser.parse(42)).toThrow('Parser for source type "number" not specified');
  });
});
