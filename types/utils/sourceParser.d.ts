declare class SourceParserError extends Error {
}
declare abstract class SourceParser<T = void, Options = unknown> {
    getSourceType(source: any): "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "array" | "class" | "null";
    parse(value: any, options?: Options): T;
    protected parseArray(source: unknown[], options?: Options): T;
    protected parseFunction(source: Function, options?: Options): T;
    protected parseClass(source: new (...args: unknown[]) => unknown, options?: Options): T;
    protected parseObject(source: object, options?: Options): T;
    protected parseString(source: string, options?: Options): T;
}
export { SourceParser, SourceParserError };
