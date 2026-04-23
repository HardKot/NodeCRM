const { SourceParser } = require('../../libs/utils/sourceParser.js');
class TestParser extends SourceParser {
    parseArray(source) {
        return `array:${source.length}`;
    }
    parseFunction(source) {
        return `function:${source.name}`;
    }
    parseClass(source) {
        return `class:${source.name}`;
    }
    parseObject(source) {
        return `object:${Object.keys(source).length}`;
    }
    parseString(source) {
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
        function sampleFunction() { }
        const result = parser.parse(sampleFunction);
        expect(result).toBe('function:sampleFunction');
    });
    it('Парсинг класса', () => {
        class SampleClass {
        }
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